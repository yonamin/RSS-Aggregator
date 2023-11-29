import { Modal } from 'bootstrap';

const errorHandler = (alert, elements) => {
  const errorMessage = alert.error !== undefined
    ? alert.error.url.message
    : alert.error;
  if (errorMessage) {
    elements.input.classList.add('is-invalid');
    elements.feedbackMessage.textContent = errorMessage;
    elements.feedbackMessage.classList.remove('text-success');
    elements.feedbackMessage.classList.add('text-danger');
  }
};

const networkErrorHandler = (value, elements, i18n) => {
  if (value) {
    elements.feedbackMessage.textContent = i18n.t('feedbackMessage.networkError');
    elements.feedbackMessage.classList.remove('text-success');
    elements.feedbackMessage.classList.add('text-danger');
  }
};

const invalidRSSHandler = (elements, i18n) => {
  elements.feedbackMessage.textContent = i18n.t('feedbackMessage.invalidRSS');
  elements.feedbackMessage.classList.remove('text-success');
  elements.feedbackMessage.classList.add('text-danger');
};

const successHandler = (elements, i18n) => {
  elements.input.classList.remove('is-invalid');
  elements.feedbackMessage.classList.remove('text-danger');
  elements.feedbackMessage.classList.add('text-success');
  elements.feedbackMessage.textContent = i18n.t('feedbackMessage.success');
  elements.form.reset();
  elements.input.focus();
};

const feedHandler = (state, elements, i18n) => {
  if (!elements.feeds.querySelector('h2')) {
    const feedsHeader = document.createElement('h2');
    feedsHeader.textContent = i18n.t('content.feeds');
    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-feeds');
    elements.feeds.append(feedsHeader, feedsList);
  }
  const { lastAddedFeed } = state.content;

  const feedEl = document.createElement('li');
  feedEl.classList.add('list-feeds-item');
  const h3 = document.createElement('h3');
  h3.textContent = lastAddedFeed.title;
  const p = document.createElement('p');
  p.textContent = lastAddedFeed.description;
  feedEl.append(h3, p);
  document.querySelector('.list-feeds').prepend(feedEl);
};

const postHandler = (posts, state, elements, i18n) => {
  if (!elements.posts.querySelector('h2')) {
    const postsHeader = document.createElement('h2');
    postsHeader.textContent = i18n.t('content.posts');
    const postsList = document.createElement('ul');
    postsList.classList.add('list-posts');
    elements.posts.append(postsHeader, postsList);
  }
  posts.forEach((post) => {
    const checkedPostsHandler = (postUi) => {
      if (postUi.checked) {
        const clickedEl = document.querySelector(`a[data-id="${postUi.postId}"]`);
        clickedEl.classList.remove('fw-bold');
        clickedEl.classList.add('fw-normal', 'link-secondary');
      }
    };
    const clickHandler = () => {
      const clickedPost = state.uiState.posts
        .find((currentPost) => currentPost.postId === post.id);
      clickedPost.checked = true;
      checkedPostsHandler(clickedPost);
    };

    const postEl = document.createElement('li');
    postEl.classList.add('list-posts-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const a = document.createElement('a');
    a.setAttribute('href', post.link);
    a.textContent = post.title;
    a.setAttribute('target', '_blank');
    a.classList.add('fw-bold');
    a.dataset.id = post.id;

    const { modalElements } = elements;
    const modal = new Modal(modalElements.container);
    const btn = document.createElement('button');
    btn.textContent = i18n.t('content.show');
    btn.dataset.id = post.id;
    btn.classList.add('btn', 'btn-sm', 'btn-outline-light');
    //
    btn.addEventListener('click', () => {
      clickHandler();
      modalElements.title.textContent = post.title;
      modalElements.body.textContent = post.description;
      modalElements.btnFullArticle.setAttribute('href', post.link);
      modalElements.btnsClose.forEach((button) => {
        button.addEventListener('click', () => {
          modal.hide();
        });
      });
      modal.show();
    });
    // rewrite on state

    postEl.append(a, btn);
    a.addEventListener('click', clickHandler);
    document.querySelector('.list-posts').prepend(postEl);
  });
};

const handleProcessStatus = (elements, process) => {
  elements.input.disabled = false;
  elements.submitButton.disabled = false;
  if (process === 'sending') {
    elements.input.disabled = true;
    elements.submitButton.disabled = true;
  }
};

const initView = (state, elements, i18n) => (path, value, _, applyData) => {
  switch (path) {
    case 'form.validationErrors':
      errorHandler(value, elements);
      break;
    case 'form.processErrors.networkError':
      networkErrorHandler(value, elements, i18n);
      break;
    case 'form.processErrors.invalidRSS':
      invalidRSSHandler(elements, i18n);
      break;
    case 'content.feeds':
      feedHandler(state, elements, i18n);
      break;
    case 'content.posts':
      postHandler(applyData.args, state, elements, i18n);
      break;
    case 'form.status':
      handleProcessStatus(elements, value, i18n);
      break;
    case 'form.rssUrls':
      successHandler(elements, i18n);
      break;
    default:
      break;
  }
};

export default initView;
