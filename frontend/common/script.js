
// 共通のヘッダーを読み込む
document.addEventListener("DOMContentLoaded", function() {
    fetch("/WebSitePractice/frontend/common/header.html")
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML("afterbegin", data);   // ページの先頭に挿入
            setupHamburgerMenu();   // ハンバーガーアイコンのクリックイベント
        });
});

function setupHamburgerMenu() {
    const hamburger = document.getElementById("hamburger");
    const menu = document.getElementById("menu");

    if(hamburger&&menu){
        hamburger.addEventListener("click", function() {
            this.classList.toggle("active");
            menu.classList.toggle("active");
        });
    }
}

document.getElementById("myButton").addEventListener("click", function() {
    let randomColor= Math.floor(Math.random()*16777215);
    this.style.backgroundColor = "#" + randomColor.toString(16).padStart(6, "0");
    document.body.style.backgroundColor = "#" + (16777215 - randomColor).toString(16).padStart(6, "0");
});