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

const processErrorHandler = (value, elements, i18n) => {
  if (value) {
    elements.feedbackMessage.textContent = i18n.t('networkError');
    elements.feedbackMessage.classList.remove('text-success');
    elements.feedbackMessage.classList.add('text-danger');
  }
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

const postHandler = (posts, elements, i18n) => {
  // posts are last added
  if (!elements.posts.querySelector('h2')) {
    const postsHeader = document.createElement('h2');
    postsHeader.textContent = i18n.t('content.posts');
    const postsList = document.createElement('ul');
    postsList.classList.add('list-posts');
    elements.posts.append(postsHeader, postsList);
  }
  posts.forEach((post) => {
    const postEl = document.createElement('li');
    postEl.classList.add('list-posts-item');
    const a = document.createElement('a');
    a.setAttribute('href', post.link);
    a.textContent = post.title;
    postEl.append(a);
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
    case 'form.processError':
      processErrorHandler(value, elements, i18n);
      break;
    case 'content.feeds':
      // lastAdded===value??
      feedHandler(state, elements, i18n);
      break;
    case 'content.posts':
      postHandler(applyData.args, elements, i18n);
      break;
    case 'form.status':
      handleProcessStatus(elements, value, i18n);
      break;
    case 'form.rssUrls':
      successHandler(elements, i18n);
      break;
    default:
  }
};

export default initView;
