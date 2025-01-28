window.onload = function () {
    loadComments();
};

function saveComments() {
  let comments = [];
  document.querySelectorAll(".comment__div").forEach((commentDiv) => {
    let userName = commentDiv.querySelector(".comment__h").textContent;
    let userComment = commentDiv.querySelector(".comment__text").textContent;
    let commentImg = commentDiv.querySelector(".comment__img").src;
    let commentTime = commentDiv.querySelector(".comment__date").textContent;
    let replies = [];
    commentDiv.querySelectorAll(".reply__item").forEach((reply) => {
      replies.push(reply.querySelector(".reply__text").textContent);
    });
    comments.push({ userName, userComment, commentImg, commentTime, replies });
  });
  localStorage.setItem("comments", JSON.stringify(comments));
}

function loadComments() {
  let commentsData = localStorage.getItem("comments");
  if (commentsData) {
    let comments = JSON.parse(commentsData);
    comments.forEach((comment) => {
      addCommentToDOM(comment.userName, comment.userComment, comment.commentImg, comment.commentTime, comment.replies);
    });
  }
}

function addComment() {
  let userName = document.getElementById("user-name").value.trim();
  let userComment = document.getElementById("user-comment").value.trim();
  let fileInput = document.getElementById("file");
  let imagePreview = "assets/default-profile.png";
  let commentTime = new Date().toLocaleString();

  if (fileInput.files[0]) {
    let reader = new FileReader();
    reader.onload = function (event) {
      imagePreview = event.target.result;
      saveNewComment(userName, userComment, imagePreview, commentTime);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveNewComment(userName, userComment, imagePreview, commentTime);
  }
}

function saveNewComment(userName, userComment, imagePreview, commentTime) {
  if (!userName || !userComment) {
    alert("Please fill in all fields!");
    return;
  }

  addCommentToDOM(userName, userComment, imagePreview, commentTime, []);
  document.getElementById("user-name").value = '';
  document.getElementById("user-comment").value = '';
  document.getElementById("file").value = '';
  document.getElementById("preview").classList.add("hidden");

  saveComments();
}

function addCommentToDOM(userName, userComment, imagePreview, commentTime, replies) {
  let commentDiv = document.createElement("div");
  commentDiv.classList.add("comment__div");
  commentDiv.innerHTML = `
    <div class="top__comment__div">
      <div class="comment__box">
        <div class="comment__head">
          <div class="comment__user">
            <img class="comment__img" src="${imagePreview}" alt="User Image">
            <h2 class="comment__h">${userName}</h2>
            <p class="comment__date">${commentTime}</p>
          </div>
          <div class="comment__btn">
            <button class="reply__btn" onclick="toggleReply(this)">Reply</button>
            <button class="edit__btn" onclick="editCommentInline(this)">Edit</button>
            <button class="delete__btn" onclick="deleteComment(this)">Delete</button>
          </div>
        </div>
        <div class="comment__paragraph">
          <p class="comment__text">${userComment}</p>
        </div>
      </div>
    </div>
    <div class="bottom__comment__div">
      <div class="replies hidden"></div>
      <div class="reply__div hidden">
        <textarea class="reply" placeholder="Write a reply..."></textarea>
        <button class="reply__button" onclick="addReply(this)">Reply</button>
      </div>
    </div>
  `;
  document.getElementById("comments-container").appendChild(commentDiv);
}

function editCommentInline(button) {
  const commentDiv = button.closest(".comment__div");
  const commentText = commentDiv.querySelector(".comment__text");
  const btnContainer = commentDiv.querySelector(".comment__btn");

  btnContainer.style.display = "none";

  const editInput = document.createElement("textarea");
  editInput.classList.add("edit__input");
  editInput.style.width = "100%";
  editInput.value = commentText.textContent;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.classList.add("save__btn");

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.classList.add("cancel__btn");

  saveButton.onclick = function () {
    commentText.textContent = editInput.value;
    resetEditMode();
    saveComments();
  };

  cancelButton.onclick = function () {
    resetEditMode();
  };

  const headDiv = commentDiv.querySelector(".comment__head");
  headDiv.appendChild(saveButton);
  headDiv.appendChild(cancelButton);

  const paragraphDiv = commentDiv.querySelector(".comment__paragraph");
  paragraphDiv.appendChild(editInput);

  commentText.style.display = "none";

  function resetEditMode() {
    editInput.remove();
    saveButton.remove();
    cancelButton.remove();
    commentText.style.display = "";
    btnContainer.style.display = "";
  }
}

function toggleReply(button) {
  const replyDiv = button.closest(".comment__div").querySelector(".reply__div");
  replyDiv.classList.toggle("hidden");
}

function addReply(button) {
  const replyDiv = button.closest(".reply__div");
  const replyText = replyDiv.querySelector(".reply").value.trim();
  const repliesContainer = button.closest(".comment__div").querySelector(".replies");

  if (!replyText) {
    alert("Reply cannot be empty!");
    return;
  }

  const replyItem = document.createElement("div");
  replyItem.classList.add("reply__item");
  replyItem.innerHTML = `
    <p class="reply__text">${replyText}</p>
    <button class="delete__btn" onclick="deleteReply(this)">Delete</button>
  `;

  repliesContainer.appendChild(replyItem);
  repliesContainer.classList.remove("hidden");
  replyDiv.querySelector(".reply").value = '';

  saveComments();
}

function deleteComment(button) {
  const commentDiv = button.closest(".comment__div");
  commentDiv.remove();
  saveComments();
}

function deleteReply(button) {
  const replyItem = button.closest(".reply__item");
  const repliesContainer = replyItem.parentElement;

  replyItem.remove();
  if (!repliesContainer.querySelector(".reply__item")) {
    repliesContainer.classList.add("hidden");
  }

  saveComments();
}

function previewImage() {
  const file = document.getElementById("file").files[0];
  const preview = document.getElementById("preview");
  const imageDiv = document.querySelector(".image__preview");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      preview.src = event.target.result;
      imageDiv.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
}
