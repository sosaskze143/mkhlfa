document.getElementById("checkForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const id = document.getElementById("idNumber").value;

  fetch("data/users.json")
    .then((res) => res.json())
    .then((data) => {
      const user = data.find((u) => u.id === id);
      const container = document.getElementById("violations");

      if (user) {
        let html = "<h2>المخالفات:</h2><ul>";
        user.violations.forEach((v) => {
          html += `<li><strong>السبب:</strong> ${v.reason}<br><strong>المبلغ:</strong> ${v.amount} ريال<br><strong>الحالة:</strong> ${v.status}</li><hr>`;
        });
        html += "</ul>";
        container.innerHTML = html;
      } else {
        container.innerHTML = "<p>لا توجد مخالفات لهذا الرقم.</p>";
      }
    });
});
