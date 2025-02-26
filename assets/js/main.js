document.addEventListener('DOMContentLoaded', function () {
    let commentsContainer = document.getElementById('comments-container');
    let userNameInput = document.getElementById('user-name');
    let userCommentInput = document.getElementById('user-comment');
    let sendButton = document.querySelector('.input__btn');
    let fileInput = document.getElementById('file');
    let imagePreview = document.getElementById('preview');
    let popup = document.querySelector('.popup');
    let confirmDeleteButton = document.querySelector('.confirmDelete');
    let cancelDeleteButton = document.querySelector('.cancelDelete');
  
    let commentToDelete = null;
    let commentToEdit = null;
    let isReplying = false;
    let replyToComment = null;
  
    if (!commentsContainer || !userNameInput || !userCommentInput || !sendButton) {
        console.error('One or more required elements are missing in the DOM.');
        return;
    }
  
    if (!isLocalStorageAvailable()) {
        console.error('localStorage is not available.');
        return;
    }
  
    addRepliesCSS();
  
    loadComments();
  
    function addRepliesCSS() {
        let style = document.createElement('style');
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
  
    window.previewImage = function () {
        let file = fileInput.files[0];
        if (file) {
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                alert('Please upload a valid image file (JPEG, PNG, GIF).');
                fileInput.value = '';
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert('File size cannot exceed 5MB.');
                fileInput.value = '';
                return;
            }
            let reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreview.parentElement.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = 'assets/images/ph-profila.jpg';
            imagePreview.parentElement.classList.remove('hidden');
        }
    };
  
    function addComment(userName, userComment, imageUrl, isReply = false, parentComment = null, mentionedUser = '', skipSave = false) {
        let commentDiv = document.createElement('div');
        commentDiv.classList.add('comment__div');
  
        if (isReply) {
            commentDiv.classList.add('reply__comment');
        }
  
        let topCommentDiv = document.createElement('div');
        topCommentDiv.classList.add('top__comment__div');
  
        let likesBox = document.createElement('div');
        likesBox.classList.add('likes__box');
  
        let incrementButton = document.createElement('button');
        incrementButton.classList.add('increment');
        incrementButton.textContent = '+';
  
        let likesCount = document.createElement('span');
        likesCount.classList.add('likes');
        likesCount.textContent = '0';
  
        let decrementButton = document.createElement('button');
        decrementButton.classList.add('decrement');
        decrementButton.textContent = '-';
  
        likesBox.appendChild(incrementButton);
        likesBox.appendChild(likesCount);
        likesBox.appendChild(decrementButton);
  
        incrementButton.addEventListener('click', function () {
            let currentLikes = parseInt(likesCount.textContent);
            currentLikes += 1;
            likesCount.textContent = currentLikes;
            saveComments();
        });
  
        decrementButton.addEventListener('click', function () {
            let currentLikes = parseInt(likesCount.textContent);
            if (currentLikes > 0) {
                currentLikes -= 1;
                likesCount.textContent = currentLikes;
                saveComments();
            }
        });
  
        let commentBox = document.createElement('div');
        commentBox.classList.add('comment__box');
  
        let commentHead = document.createElement('div');
        commentHead.classList.add('comment__head');
  
        let commentUser = document.createElement('div');
        commentUser.classList.add('comment__user');
  
        let commentImg = document.createElement('img');
        commentImg.classList.add('comment__img');
        commentImg.src = imageUrl || 'assets/images/ph-profila.jpg';
        commentImg.alt = 'User Avatar';
  
        let commentH = document.createElement('h3');
        commentH.classList.add('comment__h');
        commentH.textContent = userName;
  
        let commentDate = document.createElement('span');
        commentDate.classList.add('comment__date');
        commentDate.textContent = new Date().toLocaleDateString();
  
        commentUser.appendChild(commentImg);
        commentUser.appendChild(commentH);
        commentUser.appendChild(commentDate);
  
        let commentButtons = document.createElement('div');
        commentButtons.classList.add('comment__btn');
  
        let editButton = document.createElement('button');
        editButton.classList.add('edit__btn');
        editButton.textContent = 'Edit';
  
        editButton.addEventListener('click', function () {
            editComment(commentDiv);
        });
  
        let deleteButton = document.createElement('button');
        deleteButton.classList.add('delete__btn');
        deleteButton.textContent = 'Delete';
  
        deleteButton.addEventListener('click', function () {
            commentToDelete = commentDiv;
            popup.classList.remove('hide');
  
            confirmDeleteButton.addEventListener('click', function () {
                if (commentToDelete) {
                    let parentRepliesDiv = commentToDelete.parentElement;
                    commentToDelete.remove();
  
                    // تحقق إذا كانت الـ div التي تحتوي على الردود فارغة بعد الحذف
                    if (parentRepliesDiv && parentRepliesDiv.children.length === 0) {
                        parentRepliesDiv.remove();
                    }
  
                    commentToDelete = null;
                    popup.classList.add('hide');
                    saveComments();
                }
            });
  
            cancelDeleteButton.addEventListener('click', function () {
                commentToDelete = null;
                popup.classList.add('hide');
            });
        });
  
        let replyButton = document.createElement('button');
        replyButton.classList.add('reply__btn');
        replyButton.textContent = 'Reply';
  
        replyButton.addEventListener('click', function () {
            isReplying = true;
            replyToComment = commentDiv;
            userCommentInput.placeholder = `Reply to @${userName}`;
            userCommentInput.focus();
        });
  
        commentButtons.appendChild(editButton);
        commentButtons.appendChild(deleteButton);
        commentButtons.appendChild(replyButton);
  
        commentHead.appendChild(commentUser);
        commentHead.appendChild(commentButtons);
  
        let commentParagraph = document.createElement('p');
        commentParagraph.classList.add('comment__paragraph');
  
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
  
        if (!skipSave) {
            saveComments();
        }
  
        if (!skipSave) {
            userNameInput.value = '';
            userCommentInput.value = '';
            fileInput.value = '';
            imagePreview.src = 'assets/images/ph-profila.jpg';
            imagePreview.parentElement.classList.add('hidden');
            userCommentInput.placeholder = 'Write your comment here...';
        }
  
        return commentDiv;
    }
  
    function editComment(commentDiv) {
        let commentParagraph = commentDiv.querySelector('.comment__paragraph');
        let originalText = commentParagraph.textContent;
  
        let editButton = commentDiv.querySelector('.edit__btn');
        let replyButton = commentDiv.querySelector('.reply__btn');
        let deleteButton = commentDiv.querySelector('.delete__btn');
        editButton.style.display = 'none';
        replyButton.style.display = 'none';
        deleteButton.style.display = 'none';
  
        let editInput = document.createElement('textarea');
        editInput.classList.add('edit__input');
        editInput.value = originalText.replace(/@\w+\s/, '');
  
        let saveButton = document.createElement('button');
        saveButton.classList.add('save__btn');
        saveButton.textContent = 'Save';
  
        let cancelButton = document.createElement('button');
        cancelButton.classList.add('cancel__btn');
        cancelButton.textContent = 'Cancel';
  
        commentParagraph.replaceWith(editInput);
        commentDiv.querySelector('.comment__btn').appendChild(saveButton);
        commentDiv.querySelector('.comment__btn').appendChild(cancelButton);
  
        saveButton.addEventListener('click', function () {
            let newText = editInput.value.trim();
            if (newText) {
                commentParagraph.textContent = newText;
                editInput.replaceWith(commentParagraph);
                saveButton.remove();
                cancelButton.remove();
                saveComments();
  
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
            commentToEdit = null;
  
            editButton.style.display = 'inline-block';
            replyButton.style.display = 'inline-block';
            deleteButton.style.display = 'inline-block';
        });
    }
  
    function saveComments() {
        let comments = [];
        let topLevelComments = commentsContainer.querySelectorAll(':scope > .comment__div');
  
        topLevelComments.forEach(commentDiv => {
            let comment = {
                userName: commentDiv.querySelector('.comment__h').textContent,
                userComment: commentDiv.querySelector('.comment__paragraph').textContent,
                imageUrl: commentDiv.querySelector('.comment__img').src,
                likes: parseInt(commentDiv.querySelector('.likes').textContent),
                replies: []
            };
  
            let repliesDiv = commentDiv.querySelector('.replies');
            if (repliesDiv && repliesDiv.children.length > 0) {
                repliesDiv.querySelectorAll('.comment__div').forEach(replyDiv => {
                    let reply = {
                        userName: replyDiv.querySelector('.comment__h').textContent,
                        userComment: replyDiv.querySelector('.comment__paragraph').textContent,
                        imageUrl: replyDiv.querySelector('.comment__img').src,
                        likes: parseInt(replyDiv.querySelector('.likes').textContent)
                    };
                    comment.replies.push(reply);
                });
            }
  
            comments.push(comment);
        });
  
        localStorage.setItem('comments', JSON.stringify(comments));
    }
  
    function loadComments() {
        let comments = JSON.parse(localStorage.getItem('comments')) || [];
        commentsContainer.innerHTML = '';
  
        comments.forEach(comment => {
            let mainComment = addComment(
                comment.userName,
                comment.userComment,
                comment.imageUrl,
                false,
                null,
                '',
                true
            );
  
            let likesCount = mainComment.querySelector('.likes');
            likesCount.textContent = comment.likes || 0;
  
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    let replyComment = addComment(
                        reply.userName,
                        reply.userComment,
                        reply.imageUrl,
                        true,
                        mainComment,
                        comment.userName,
                        true
                    );
  
                    let replyLikesCount = replyComment.querySelector('.likes');
                    replyLikesCount.textContent = reply.likes || 0;
                });
            }
        });
    }
  
    sendButton.addEventListener('click', function () {
        let userName = userNameInput.value.trim();
        let userComment = userCommentInput.value.trim();
        let imageUrl = imagePreview.src;
  
        if (!userName || !userComment) {
            alert('Please fill in all fields.');
            return;
        }
  
        if (userComment.length > MAX_COMMENT_LENGTH) {
            alert(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
            return;
        }
  
        if (commentToEdit) {
            let commentParagraph = commentToEdit.querySelector('.comment__paragraph');
            commentParagraph.textContent = userComment;
            commentToEdit = null;
            sendButton.textContent = 'SEND';
            saveComments();
        } else if (isReplying && replyToComment) {
            addComment(
                userName,
                userComment,
                imageUrl,
                true,
                replyToComment,
                replyToComment.querySelector('.comment__h').textContent,
                false
            );
            isReplying = false;
            replyToComment = null;
            userCommentInput.placeholder = 'Write your comment here...';
        } else {
            addComment(userName, userComment, imageUrl);
        }
    });
  
    function isLocalStorageAvailable() {
        try {
            let test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
  
    let MAX_COMMENT_LENGTH = 500;
    let MAX_FILE_SIZE = 5 * 1024 * 1024;
    let ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  });