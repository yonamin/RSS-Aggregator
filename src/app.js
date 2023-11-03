import * as yup from 'yup';
import onChange from 'on-change';
import _ from 'lodash';
import i18next from 'i18next';
import view from './view.js';
import resources from './locales/index.js';

// const routes = {}

// const networkError = () => 'Network Problems. Try again.';

const app = (i18nextInstance) => {
  const state = {
    form: {
      field: {
        url: '',
      },
      status: 'filling',
      feedUrls: [],
      errors: {},
      processErrors: null,
    },
  };

  yup.setLocale({
    // mixed: {
    //     default: 'feedbackMessage.invalidUrl',
    // },
    string: {
      notOneOf: i18nextInstance.t('feedbackMessage.alreadyExists'),
      url: i18nextInstance.t('feedbackMessage.invalidUrl'),
    },
  });

  const schema = yup.object().shape({
    url: yup.string().url().notOneOf(state.form.feedUrls).required(),
  });

  const validate = (field) => schema.validate(field, { abortEarly: false })
    .then(() => {})
    .catch((e) => _.keyBy(e.inner, 'path'));

  const elements = {
    input: document.getElementById('url-input'),
    submitButton: document.getElementById('rss-submit'),
    form: document.querySelector('form'),
    feedbackMessage: document.querySelector('.feedback'),
    // add feeds??
  };

  const watchState = onChange(state, view(elements, i18nextInstance));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const value = formData.get('url');
    watchState.form.field.url = value;
    validate(watchState.form.field)
      .then((error) => {
        watchState.form.errors = { error };
      });

    if (!_.isEmpty(watchState.form.errors.error)) {
      watchState.form.status = 'error';
      return;
    }
    watchState.form.status = 'sending';

    watchState.form.feedUrls.push(value);
    watchState.form.status = 'success';

    watchState.form.status = 'filling';

    // elements.form.reset();
    // elements.input.focus();
  });
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => app(i18nextInstance));
  // ?????
};
