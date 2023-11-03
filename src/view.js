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

const successHandler = (elements, i18n) => {
  elements.input.classList.remove('is-invalid');
  elements.feedbackMessage.classList.remove('text-danger');
  elements.feedbackMessage.classList.add('text-success');
  elements.feedbackMessage.textContent = i18n.t('feedbackMessage.success');
};

const feedHandler = () => {};
const handleProcessStatus = (elements, process, i18n) => {
  if (process === 'sending') {
    elements.input.disabled = true;
    elements.submitButton.disabled = true;
    return;
  }
  if (process === 'success') {
    successHandler(elements, i18n);
    elements.form.reset();
    elements.input.focus();
  }
  elements.input.disabled = false;
  elements.submitButton.disabled = false;
};

const initView = (elements, i18n) => (path, value) => {
  switch (path) {
    case 'form.errors':
      errorHandler(value, elements);
      break;
    case 'form.feedUrls':
      feedHandler();
      break;
    case 'form.status':
      handleProcessStatus(elements, value, i18n);
      break;
    default:
  }
};

export default initView;
