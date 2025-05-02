// رابط API الخاص بـ Google Sheets
const apiUrl = "https://script.google.com/macros/s/AKfycbyY6TWhh1RMfhVKHZbQmRDa24CqqzDD2d10H-M9jRAFJ6wYDG06HrhHV_OwPNPe6QfkeQ/exec";

// جلب البيانات من Google Sheets عبر الـ API
fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    console.log(data); // البيانات المسترجعة من الـ Google Sheets
    // هنا تقدر تتعامل مع البيانات، مثل عرض المخالفات في الموقع
    displayViolations(data);
  })
  .catch(error => {
    console.error("حدث خطأ في جلب البيانات:", error);
  });

// دالة لعرض البيانات في الصفحة
function displayViolations(data) {
  const resultDiv = document.getElementById("result");
  let html = "";

  // هنا تعرض البيانات المسترجعة
  data.forEach(user => {
    html += `<h2>الاسم: ${user.Name}</h2>`;
    html += `<p>رقم الهوية: ${user.ID}</p>`;
    html += `<p>عدد المخالفات: ${user.Violation}</p>`;
    html += `<p>المبلغ: ${user.Amount} ريال</p>`;
    html += `<p>الحالة: ${user.Status}</p>`;
    html += `<p>التاريخ: ${user.Date}</p>`;
    html += `<hr>`;
  });

  resultDiv.innerHTML = html;
}

// وظائف التعامل مع البيانات المحلية

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getRequests() {
  return JSON.parse(localStorage.getItem("requests")) || [];
}

function saveRequests(requests) {
  localStorage.setItem("requests", JSON.stringify(requests));
}

let currentUser = null;

document.getElementById("searchForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const id = document.getElementById("identityInput").value;
  const users = getUsers();
  const user = users.find(u => u.id === id);

  const resultDiv = document.getElementById("result");
  const downloadBtn = document.getElementById("downloadBtn");

  if (!user) {
    resultDiv.innerHTML = "<p style='color:red;'>لم يتم العثور على مستخدم بهذا الرقم.</p>";
    downloadBtn.style.display = "none";
    return;
  }

  currentUser = user;
  let html = `<h2>الاسم: ${user.name}</h2>`;
  if (user.violations.length === 0) {
    html += "<p>لا توجد مخالفات.</p>";
    downloadBtn.style.display = "none";
  } else {
    html += "<ul>";
    user.violations.forEach((v, i) => {
      html += `<li>
        <strong>السبب:</strong> ${v.reason} | 
        <strong>المبلغ:</strong> ${v.amount} ريال | 
        <strong>الحالة:</strong> ${v.status} | 
        <strong>التاريخ:</strong> ${v.date}
        ${v.status === "غير مدفوعة" ? ` | <button onclick="submitRequest(${i})">طلب امتناع</button> | <button onclick="markPaid(${i})">تحديد الدفع</button>` : ""}
      </li>`;
    });
    html += "</ul>";
    downloadBtn.style.display = "inline-block";
  }

  resultDiv.innerHTML = html;
});

// تحميل PDF
document.getElementById("downloadBtn").addEventListener("click", function () {
  if (!currentUser) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("Arial");

  doc.text(`كشف المخالفات`, 105, 20, null, null, "center");
  doc.text(`الاسم: ${currentUser.name}`, 20, 30);
  doc.text(`رقم الهوية: ${currentUser.id}`, 20, 38);

  let y = 50;
  currentUser.violations.forEach((v, i) => {
    doc.text(`مخالفة ${i + 1}:`, 20, y);
    y += 8;
    doc.text(`- السبب: ${v.reason}`, 25, y); y += 8;
    doc.text(`- المبلغ: ${v.amount} ريال`, 25, y); y += 8;
    doc.text(`- الحالة: ${v.status}`, 25, y); y += 8;
    doc.text(`- التاريخ: ${v.date}`, 25, y); y += 12;
  });

  doc.save("كشف_المخالفات.pdf");
});

// إرسال طلب امتناع مع إضافة سبب
function submitRequest(violationIndex) {
  const reason = prompt("أدخل سبب طلب الامتناع:");
  if (!reason) {
    alert("السبب مطلوب!");
    return;
  }

  const requests = getRequests();

  const existing = requests.find(r => r.userId === currentUser.id && r.violationIndex === violationIndex);
  if (existing) {
    alert("تم إرسال طلب لهذه المخالفة مسبقًا.");
    return;
  }

  requests.push({
    userId: currentUser.id,
    userName: currentUser.name,
    violationIndex,
    reason: reason,
    status: "قيد المراجعة",
    date: new Date().toLocaleDateString()
  });

  saveRequests(requests);
  alert("تم إرسال طلب الامتناع. سيتم مراجعته من قبل الإدارة.");
}

// تغيير حالة الدفع للمخالفة
function markPaid(violationIndex) {
  const paymentAmount = prompt("أدخل المبلغ المدفوع (جزئي أو كامل):");
  if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
    alert("المبلغ المدفوع غير صحيح.");
    return;
  }

  currentUser.violations[violationIndex].status = "مدفوعة";
  currentUser.violations[violationIndex].paymentAmount = paymentAmount;

  saveUsers(getUsers());
  alert("تم تحديث حالة المخالفة.");
}
