document.addEventListener('DOMContentLoaded', function () {
  const commentsContainer = document.getElementById('comments-container');
  const userNameInput = document.getElementById('user-name');
  const userCommentInput = document.getElementById('user-comment');
  const sendButton = document.querySelector('.input__btn');
  const fileInput = document.getElementById('file');
  const imagePreview = document.getElementById('preview');
  const popup = document.querySelector('.popup');
  const confirmDeleteButton = document.querySelector('.confirmDelete');
  const cancelDeleteButton = document.querySelector('.cancelDelete');

  let commentToDelete = null;
  let commentToEdit = null;
  let isReplying = false;
  let replyToComment = null;

  // تحقق من وجود العناصر المطلوبة في DOM
  if (!commentsContainer || !userNameInput || !userCommentInput || !sendButton) {
      console.error('One or more required elements are missing in the DOM.');
      return;
  }

  // تحقق من توفر localStorage
  if (!isLocalStorageAvailable()) {
      console.error('localStorage is not available.');
      return;
  }

  // إضافة CSS لتوحيد عرض الردود
  addRepliesCSS();

  // تحميل التعليقات من localStorage
  loadComments();

  // إضافة CSS لتوحيد عرض الردود
  function addRepliesCSS() {
      const style = document.createElement('style');
      style.textContent = `
          .replies {
              width: 90% !important; /* عرض ثابت للردود */
              box-sizing: border-box !important;
              border: 1px solid #ccc;
              margin: 10px auto;
              border-radius: 25px;
              overflow: hidden;
          }
          .replies .comment__div {
              width: 100% !important;
              box-sizing: border-box !important;
          }
          .replies .top__comment__div {
              width: 100% !important;
              box-sizing: border-box !important;
              border-bottom: 1px solid #ccc;
          }
          .replies .comment__box {
              width: calc(100% - 50px) !important;
              box-sizing: border-box !important;
          }
          .reply__comment {
              width: 90% !important; /* عرض ثابت للردود */
          }
      `;
      document.head.appendChild(style);
  }

  // معاينة الصورة قبل التحميل
  window.previewImage = function () {
      const file = fileInput.files[0];
      if (file) {
          if (!ALLOWED_FILE_TYPES.includes(file.type)) {
              alert('Please upload a valid image file (JPEG, PNG, GIF).');
              fileInput.value = ''; // مسح الملف غير الصالح
              return;
          }
          if (file.size > MAX_FILE_SIZE) {
              alert('File size cannot exceed 5MB.');
              fileInput.value = ''; // مسح الملف الكبير
              return;
          }
          const reader = new FileReader();
          reader.onload = function (e) {
              imagePreview.src = e.target.result;
              imagePreview.parentElement.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
      } else {
          imagePreview.src = 'assets/images/ph-profila.jpg'; // استخدام الصورة الافتراضية
          imagePreview.parentElement.classList.remove('hidden');
      }
  };

  // إضافة تعليق جديد أو رد
  function addComment(userName, userComment, imageUrl, isReply = false, parentComment = null, mentionedUser = '', skipSave = false) {
      const commentDiv = document.createElement('div');
      commentDiv.classList.add('comment__div');

      if (isReply) {
          commentDiv.classList.add('reply__comment'); // إضافة كلاس للردود
      }

      const topCommentDiv = document.createElement('div');
      topCommentDiv.classList.add('top__comment__div');

      const likesBox = document.createElement('div');
      likesBox.classList.add('likes__box');

      const incrementButton = document.createElement('button');
      incrementButton.classList.add('increment');
      incrementButton.textContent = '+';

      const likesCount = document.createElement('span');
      likesCount.classList.add('likes');
      likesCount.textContent = '0';

      const decrementButton = document.createElement('button');
      decrementButton.classList.add('decrement');
      decrementButton.textContent = '-';

      likesBox.appendChild(incrementButton);
      likesBox.appendChild(likesCount);
      likesBox.appendChild(decrementButton);

      // إضافة Event Listener لأزرار اللايكات
      incrementButton.addEventListener('click', function () {
          let currentLikes = parseInt(likesCount.textContent);
          currentLikes += 1;
          likesCount.textContent = currentLikes;
          saveComments(); // حفظ التغييرات في localStorage
      });

      decrementButton.addEventListener('click', function () {
          let currentLikes = parseInt(likesCount.textContent);
          if (currentLikes > 0) {
              currentLikes -= 1;
              likesCount.textContent = currentLikes;
              saveComments(); // حفظ التغييرات في localStorage
          }
      });

      const commentBox = document.createElement('div');
      commentBox.classList.add('comment__box');

      const commentHead = document.createElement('div');
      commentHead.classList.add('comment__head');

      const commentUser = document.createElement('div');
      commentUser.classList.add('comment__user');

      const commentImg = document.createElement('img');
      commentImg.classList.add('comment__img');
      commentImg.src = imageUrl || 'assets/images/ph-profila.jpg'; // استخدام الصورة الافتراضية
      commentImg.alt = 'User Avatar';

      const commentH = document.createElement('h3');
      commentH.classList.add('comment__h');
      commentH.textContent = userName;

      const commentDate = document.createElement('span');
      commentDate.classList.add('comment__date');
      commentDate.textContent = new Date().toLocaleDateString();

      commentUser.appendChild(commentImg);
      commentUser.appendChild(commentH);
      commentUser.appendChild(commentDate);

      const commentButtons = document.createElement('div');
      commentButtons.classList.add('comment__btn');

      const editButton = document.createElement('button');
      editButton.classList.add('edit__btn');
      editButton.textContent = 'Edit';

      editButton.addEventListener('click', function () {
          editComment(commentDiv);
      });

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete__btn');
      deleteButton.textContent = 'Delete';

      deleteButton.addEventListener('click', function () {
          commentToDelete = commentDiv;
          popup.classList.remove('hide');
      });

      const replyButton = document.createElement('button');
      replyButton.classList.add('reply__btn');
      replyButton.textContent = 'Reply';

      replyButton.addEventListener('click', function () {
          isReplying = true;
          replyToComment = commentDiv;
          userCommentInput.placeholder = `Reply to @${userName}`;
          userCommentInput.focus(); // تركيز المؤشر على حقل التعليق
      });

      commentButtons.appendChild(editButton);
      commentButtons.appendChild(deleteButton);
      commentButtons.appendChild(replyButton);

      commentHead.appendChild(commentUser);
      commentHead.appendChild(commentButtons);

      const commentParagraph = document.createElement('p');
      commentParagraph.classList.add('comment__paragraph');

      // تجنب إضافة المنشن إذا كان موجودًا بالفعل
      if (mentionedUser && !userComment.startsWith(`@${mentionedUser}`)) {
          commentParagraph.textContent = `@${mentionedUser} ${userComment}`;
      } else {
          commentParagraph.textContent = userComment;
      }

      commentBox.appendChild(commentHead);
      commentBox.appendChild(commentParagraph);

      topCommentDiv.appendChild(likesBox);
      topCommentDiv.appendChild(commentBox);

      commentDiv.appendChild(topCommentDiv);

      if (isReply && parentComment) {
          let repliesDiv = parentComment.querySelector('.replies');

          if (!repliesDiv) {
              repliesDiv = document.createElement('div');
              repliesDiv.classList.add('replies');
              parentComment.appendChild(repliesDiv);
          }

          repliesDiv.appendChild(commentDiv);
      } else {
          commentsContainer.appendChild(commentDiv);
      }

      // حفظ التعليقات في localStorage (فقط إذا كان skipSave = false)
      if (!skipSave) {
          saveComments();
      }

      // مسح الحقول بعد إضافة التعليق أو الرد (فقط إذا كان skipSave = false)
      if (!skipSave) {
          userNameInput.value = '';
          userCommentInput.value = '';
          fileInput.value = '';
          imagePreview.src = 'assets/images/ph-profila.jpg'; // إعادة تعيين الصورة الافتراضية
          imagePreview.parentElement.classList.add('hidden');
          userCommentInput.placeholder = 'Write your comment here...';
      }

      return commentDiv; // إرجاع العنصر الذي تم إنشاؤه
  }

  // تعديل تعليق
  function editComment(commentDiv) {
      const commentParagraph = commentDiv.querySelector('.comment__paragraph');
      const originalText = commentParagraph.textContent;

      // إخفاء الأزرار الأخرى (Edit و Reply و Delete)
      const editButton = commentDiv.querySelector('.edit__btn');
      const replyButton = commentDiv.querySelector('.reply__btn');
      const deleteButton = commentDiv.querySelector('.delete__btn');
      editButton.style.display = 'none';
      replyButton.style.display = 'none';
      deleteButton.style.display = 'none';

      const editInput = document.createElement('textarea');
      editInput.classList.add('edit__input');
      editInput.value = originalText.replace(/@\w+\s/, ''); // إزالة الإشارة إذا وجدت

      const saveButton = document.createElement('button');
      saveButton.classList.add('save__btn');
      saveButton.textContent = 'Save';

      const cancelButton = document.createElement('button');
      cancelButton.classList.add('cancel__btn');
      cancelButton.textContent = 'Cancel';

      commentParagraph.replaceWith(editInput);
      commentDiv.querySelector('.comment__btn').appendChild(saveButton);
      commentDiv.querySelector('.comment__btn').appendChild(cancelButton);

      saveButton.addEventListener('click', function () {
          const newText = editInput.value.trim();
          if (newText) {
              commentParagraph.textContent = newText;
              editInput.replaceWith(commentParagraph);
              saveButton.remove();
              cancelButton.remove();
              saveComments();

              // إعادة إظهار الأزرار الأخرى
              editButton.style.display = 'inline-block';
              replyButton.style.display = 'inline-block';
              deleteButton.style.display = 'inline-block';
          } else {
              alert('Comment cannot be empty.');
          }
      });

      cancelButton.addEventListener('click', function () {
          editInput.replaceWith(commentParagraph);
          saveButton.remove();
          cancelButton.remove();
          commentToEdit = null; // إعادة تعيين حالة التعديل

          // إعادة إظهار الأزرار الأخرى
          editButton.style.display = 'inline-block';
          replyButton.style.display = 'inline-block';
          deleteButton.style.display = 'inline-block';
      });
  }

  // حفظ التعليقات في localStorage
  function saveComments() {
      const comments = [];
      const topLevelComments = commentsContainer.querySelectorAll(':scope > .comment__div');

      topLevelComments.forEach(commentDiv => {
          const comment = {
              userName: commentDiv.querySelector('.comment__h').textContent,
              userComment: commentDiv.querySelector('.comment__paragraph').textContent,
              imageUrl: commentDiv.querySelector('.comment__img').src,
              likes: parseInt(commentDiv.querySelector('.likes').textContent), // حفظ عدد الإعجابات
              replies: []
          };

          const repliesDiv = commentDiv.querySelector('.replies');
          if (repliesDiv) {
              repliesDiv.querySelectorAll('.comment__div').forEach(replyDiv => {
                  const reply = {
                      userName: replyDiv.querySelector('.comment__h').textContent,
                      userComment: replyDiv.querySelector('.comment__paragraph').textContent,
                      imageUrl: replyDiv.querySelector('.comment__img').src,
                      likes: parseInt(replyDiv.querySelector('.likes').textContent) // حفظ عدد الإعجابات للردود
                  };
                  comment.replies.push(reply);
              });
          }

          comments.push(comment);
      });

      localStorage.setItem('comments', JSON.stringify(comments));
  }

  // تحميل التعليقات من localStorage
  function loadComments() {
      const comments = JSON.parse(localStorage.getItem('comments')) || [];
      commentsContainer.innerHTML = ''; // مسح التعليقات الحالية قبل التحميل

      comments.forEach(comment => {
          // إضافة التعليق الرئيسي
          const mainComment = addComment(
              comment.userName,
              comment.userComment,
              comment.imageUrl,
              false,
              null,
              '',
              true
          );

          // تحديث عدد الإعجابات للتعليق الرئيسي
          const likesCount = mainComment.querySelector('.likes');
          likesCount.textContent = comment.likes || 0;

          // إضافة الردود إذا وجدت
          if (comment.replies && comment.replies.length > 0) {
              comment.replies.forEach(reply => {
                  const replyComment = addComment(
                      reply.userName,
                      reply.userComment,
                      reply.imageUrl,
                      true,
                      mainComment,
                      comment.userName,
                      true
                  );

                  // تحديث عدد الإعجابات للرد
                  const replyLikesCount = replyComment.querySelector('.likes');
                  replyLikesCount.textContent = reply.likes || 0;
              });
          }
      });
  }

  // حدث النقر على زر الإرسال
  sendButton.addEventListener('click', function () {
      const userName = userNameInput.value.trim();
      const userComment = userCommentInput.value.trim();
      const imageUrl = imagePreview.src;

      if (!userName || !userComment) {
          alert('Please fill in all fields.');
          return;
      }

      if (userComment.length > MAX_COMMENT_LENGTH) {
          alert(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
          return;
      }

      if (commentToEdit) {
          // تحديث التعليق الحالي
          const commentParagraph = commentToEdit.querySelector('.comment__paragraph');
          commentParagraph.textContent = userComment;
          commentToEdit = null;
          sendButton.textContent = 'SEND';
          saveComments();
      } else if (isReplying && replyToComment) {
          // إضافة رد
          addComment(
              userName,
              userComment,
              imageUrl,
              true,
              replyToComment,
              replyToComment.querySelector('.comment__h').textContent,
              false
          );
          isReplying = false; // إعادة تعيين حالة الرد
          replyToComment = null; // إعادة تعيين التعليق الذي يتم الرد عليه
          userCommentInput.placeholder = 'Write your comment here...'; // إعادة تعيين النص البديل
      } else {
          // إضافة تعليق جديد
          addComment(userName, userComment, imageUrl);
      }
  });

  // حدث النقر على زر تأكيد الحذف
  confirmDeleteButton.addEventListener('click', function () {
      if (commentToDelete) {
          commentToDelete.remove();
          commentToDelete = null;
          popup.classList.add('hide');
          saveComments();
      }
  });

  // حدث النقر على زر إلغاء الحذف
  cancelDeleteButton.addEventListener('click', function () {
      commentToDelete = null;
      popup.classList.add('hide');
  });

  // تحقق من توفر localStorage
  function isLocalStorageAvailable() {
      try {
          const test = 'test';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
      } catch (e) {
          return false;
      }
  }

  // الثوابت
  const MAX_COMMENT_LENGTH = 500;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
});