import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import _, { uniqueId } from 'lodash';
import i18next from 'i18next';
import view from './view.js';
import resources from './locales/index.js';

const parse = (data) => {
  const parser = new DOMParser();
  return parser.parseFromString(data, 'application/xml');
};

const normalizeFeed = (doc) => {
  const feed = {
    title: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
    id: uniqueId(),
  };
  return feed;
};
const normalizePosts = (doc, feedId) => {
  const posts = [];
  doc.querySelectorAll('item').forEach((node) => {
    const item = {
      title: node.querySelector('title').textContent,
      link: node.querySelector('link').textContent,
      feedId,
      id: uniqueId(),
    };
    posts.push(item);
  });
  return posts;
};

const getPosts = (inputedUrl) => {
  const encoded = encodeURIComponent(inputedUrl);
  const disabledCacheUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encoded}`;
  return axios.get(disabledCacheUrl)
    .then((response) => {
      const doc = parse(response.data.contents);
      const feed = normalizeFeed(doc);
      const posts = normalizePosts(doc, feed.id);
      return { feed, posts };
    });
};

const checkNewPosts = (state) => {
  state.form.rssUrls.forEach((item) => {
    getPosts(item.url)
      .then((newContent) => {
        newContent.posts.forEach((newPost) => {
          const alreadyExists = state.content.posts
            .find((oldPost) => oldPost.link === newPost.link);
          if (!alreadyExists) {
            newPost.feedId = item.feedId;
            state.content.posts.push(newPost);
          }
        });
      });
  });
};

const app = (i18nextInstance) => {
  const state = {
    form: {
      status: 'filling',
      rssUrls: [],
      validationErrors: {},
      processError: null,
    },
    content: {
      feeds: [],
      lastAddedFeed: {},
      posts: [],
    },
  };
  const elements = {
    input: document.getElementById('url-input'),
    submitButton: document.getElementById('rss-submit'),
    form: document.querySelector('form'),
    feedbackMessage: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };
  const watchedState = onChange(state, view(state, elements, i18nextInstance));

  yup.setLocale({
    string: {
      isUnique: i18nextInstance.t('feedbackMessage.alreadyExists'),
      url: i18nextInstance.t('feedbackMessage.invalidUrl'),
    },
  });
  const urls = watchedState.form.rssUrls.map((item) => item.url);
  const isUnique = (url) => !urls.includes(url);
  const schema = yup.object({
    url: yup.string().url()
      .test('isUnique', i18nextInstance.t('feedbackMessage.alreadyExists'), (value) => isUnique(value))
      .required(),
  });

  const validate = (field) => schema.validate(field, { abortEarly: false })
    .then(() => {})
    .catch((e) => _.keyBy(e.inner, 'path'));

  setTimeout(function run() {
    checkNewPosts(watchedState);
    setTimeout(run, 5000);
  }, 5000);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.status = 'sending';
    watchedState.form.processError = null;

    const value = elements.input.value.trim();
    validate({ url: value })
      .then((error) => {
        watchedState.form.validationErrors = { error };
        if (!_.isEmpty(watchedState.form.validationErrors.error)) {
          watchedState.form.status = 'error';
          throw error;
        }
      })
      .then(() => getPosts(value))
      .then((content) => {
        watchedState.form.rssUrls.push({ url: value, feedId: content.feed.id });
        watchedState.content.lastAddedFeed = content.feed;
        watchedState.content.feeds.push(content.feed);
        watchedState.content.posts.push(...content.posts);
        watchedState.form.status = 'success';
      })
      .catch((err) => {
        if (!err.url) {
          watchedState.form.status = 'error';
          watchedState.form.processError = err;
        }
      });
  });
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => app(i18nextInstance));
};
