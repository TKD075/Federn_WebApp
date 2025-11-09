package main

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    _ "github.com/lib/pq"
)

type Project struct {
    ID          int       `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    URL         string    `json:"url"`
    CreatedAt   time.Time `json:"created_at"`
}

type Profile struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Title     string    `json:"title"`
    Bio       string    `json:"bio"`
    GitHubURL string    `json:"github_url"`
    AvatarURL string    `json:"avatar_url"`
    UpdatedAt time.Time `json:"updated_at"`
}

func env(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}

func dbConnString() string {
    host := env("DB_HOST", "localhost")
    port := env("DB_PORT", "5432")
    user := env("DB_USER", "postgres")
    pass := env("DB_PASSWORD", "postgres")
    name := env("DB_NAME", "postgres")
    sslmode := env("DB_SSLMODE", "disable")
    // include connect_timeout for faster failures when DB not ready
    return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=3", host, port, user, pass, name, sslmode)
}

func waitForDB(db *sql.DB, attempts int, delay time.Duration) error {
    var err error
    for i := 0; i < attempts; i++ {
        ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
        err = db.PingContext(ctx)
        cancel()
        if err == nil {
            return nil
        }
        log.Printf("db ping failed (attempt %d/%d): %v", i+1, attempts, err)
        time.Sleep(delay)
        delay = delay + delay/2
    }
    return err
}

func ensureSchema(db *sql.DB) error {
    if _, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `); err != nil {
        return err
    }

    if _, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS profiles (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            bio TEXT NOT NULL,
            github_url TEXT NOT NULL,
            avatar_url TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `); err != nil {
        return err
    }

    // Seed project if empty
    var cnt int
    if err := db.QueryRow("SELECT COUNT(*) FROM projects").Scan(&cnt); err != nil {
        return err
    }
    if cnt == 0 {
        if _, err := db.Exec(`
            INSERT INTO projects (title, description, url)
            VALUES ($1, $2, $3)
        `, "初期プロジェクト", "バックエンドとフロントエンドの疎通確認用データ", "https://github.com/your-username/your-repo"); err != nil {
            return err
        }
    }

    // Seed profile if empty
    cnt = 0
    if err := db.QueryRow("SELECT COUNT(*) FROM profiles").Scan(&cnt); err != nil {
        return err
    }
    if cnt == 0 {
        if _, err := db.Exec(`
            INSERT INTO profiles (name, title, bio, github_url, avatar_url)
            VALUES ($1, $2, $3, $4, $5)
        `, "山田 太郎", "フロントエンドエンジニア", "Webアプリとクラウド基盤を中心に、設計から実装・運用まで横断して担当しています。", "https://github.com/your-username", ""); err != nil {
            return err
        }
    }
    return nil
}

func withCORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func main() {
    addr := ":8080"
    if p := os.Getenv("PORT"); p != "" {
        if _, err := strconv.Atoi(p); err == nil {
            addr = ":" + p
        }
    }
    log.Printf("starting backend, will listen on %s", addr)

    log.Printf("opening DB connection to %s:%s/%s as %s", env("DB_HOST", "localhost"), env("DB_PORT", "5432"), env("DB_NAME", "postgres"), env("DB_USER", "postgres"))
    db, err := sql.Open("postgres", dbConnString())
    if err != nil {
        log.Fatalf("failed to open DB: %v", err)
    }
    defer db.Close()

    log.Printf("waiting for DB to be ready...")
    if err := waitForDB(db, 20, 500*time.Millisecond); err != nil {
        log.Fatalf("failed to connect DB: %v", err)
    }
    log.Printf("DB is ready. Ensuring schema...")
    if err := ensureSchema(db); err != nil {
        log.Fatalf("failed to ensure schema: %v", err)
    }

    mux := http.NewServeMux()
    mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("ok"))
    })

    // List latest projects (up to 20)
    mux.HandleFunc("/api/projects", func(w http.ResponseWriter, r *http.Request) {
        rows, err := db.Query(`
            SELECT id, title, description, url, created_at
            FROM projects
            ORDER BY created_at DESC, id DESC
            LIMIT 20
        `)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        defer rows.Close()
        list := make([]Project, 0, 10)
        for rows.Next() {
            var p Project
            if err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.URL, &p.CreatedAt); err != nil {
                http.Error(w, err.Error(), http.StatusInternalServerError)
                return
            }
            list = append(list, p)
        }
        if err := rows.Err(); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _ = json.NewEncoder(w).Encode(list)
    })

    // Latest single project (QueryRow example)
    mux.HandleFunc("/api/project/latest", func(w http.ResponseWriter, r *http.Request) {
        var p Project
        err := db.QueryRow(`
            SELECT id, title, description, url, created_at
            FROM projects
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        `).Scan(&p.ID, &p.Title, &p.Description, &p.URL, &p.CreatedAt)
        if err != nil {
            if err == sql.ErrNoRows {
                http.Error(w, "no project", http.StatusNotFound)
                return
            }
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _ = json.NewEncoder(w).Encode(p)
    })

    // Single profile (QueryRow example)
    mux.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
        var p Profile
        err := db.QueryRow(`
            SELECT id, name, title, bio, github_url, avatar_url, updated_at
            FROM profiles
            ORDER BY id ASC
            LIMIT 1
        `).Scan(&p.ID, &p.Name, &p.Title, &p.Bio, &p.GitHubURL, &p.AvatarURL, &p.UpdatedAt)
        if err != nil {
            if err == sql.ErrNoRows {
                http.Error(w, "no profile", http.StatusNotFound)
                return
            }
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        _ = json.NewEncoder(w).Encode(p)
    })

    // Contact endpoint (logs only)
    mux.HandleFunc("/api/contact", func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            w.WriteHeader(http.StatusMethodNotAllowed)
            return
        }
        var payload struct {
            Name    string `json:"name"`
            Email   string `json:"email"`
            Message string `json:"message"`
        }
        if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
            http.Error(w, "invalid json", http.StatusBadRequest)
            return
        }
        if len(payload.Name) == 0 || len(payload.Email) == 0 || len(payload.Message) == 0 {
            http.Error(w, "missing fields", http.StatusBadRequest)
            return
        }
        if len(payload.Name) > 200 || len(payload.Email) > 320 || len(payload.Message) > 5000 {
            http.Error(w, "payload too large", http.StatusRequestEntityTooLarge)
            return
        }
        log.Printf("contact: name=%q email=%q message=%q", payload.Name, payload.Email, payload.Message)
        w.WriteHeader(http.StatusNoContent)
    })

    handler := withCORS(mux)
    log.Printf("listening on %s", addr)
    if err := http.ListenAndServe(addr, handler); err != nil {
        log.Fatalf("server error: %v", err)
    }
}
