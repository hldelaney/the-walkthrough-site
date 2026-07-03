// Launch-list signup — posts to /api/subscribe (Cloudflare Pages Function + KV).
// Honest status reporting: success is shown only when the write actually succeeded.
(function () {
  "use strict";

  var FAIL = "That didn't save. Please try again, or email contact@hldelaney.com.";

  function statusEl(form) {
    var next = form.nextElementSibling;
    return next && next.classList.contains("form-status") ? next : null;
  }

  Array.prototype.forEach.call(document.querySelectorAll("form.notify-form"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = statusEl(form);
      var button = form.querySelector('button[type="submit"]');
      var email = (form.email.value || "").trim();
      if (!email) return;

      button.disabled = true;
      if (status) status.textContent = "Saving…";

      fetch(form.action, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email,
          company: form.company ? form.company.value : "",
        }),
      })
        .then(function (res) {
          return res.json().then(
            function (data) { return { res: res, data: data }; },
            function () { return { res: res, data: {} }; }
          );
        })
        .then(function (r) {
          if (r.res.ok && r.data.ok) {
            if (status) status.textContent = "You're on the list. We'll email you the moment it's live.";
            form.reset();
          } else if (r.data && r.data.error === "invalid email") {
            if (status) status.textContent = "That email doesn't look right — mind checking it?";
          } else {
            if (status) status.textContent = FAIL;
          }
        })
        .catch(function () {
          if (status) status.textContent = FAIL;
        })
        .then(function () {
          button.disabled = false;
        });
    });
  });
})();
