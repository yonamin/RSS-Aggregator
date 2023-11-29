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
  const title = doc.querySelector('title');
  const description = doc.querySelector('description');
  if (title && description) {
    const feed = {
      title: title.textContent,
      description: description.textContent,
      id: uniqueId(),
    };
    return feed;
  }
  throw new Error('Invalid format');
};
const normalizePosts = (doc, feedId) => {
  const postList = [];
  doc.querySelectorAll('item').forEach((node) => {
    const post = {
      title: node.querySelector('title').textContent,
      link: node.querySelector('link').textContent,
      description: node.querySelector('description').textContent,
      feedId,
      id: uniqueId(),
    };

    const postUi = {
      postId: post.id,
      checked: false,
    };
    postList.push({ post, postUi });
  });

  return postList;
};

const app = (i18nextInstance) => {
  const state = {
    form: {
      status: 'filling',
      rssUrls: [],
      validationErrors: {},
      processErrors: {
        networkError: null,
        invalidRSS: {},
      },
    },
    content: {
      feeds: [],
      lastAddedFeed: {},
      posts: [],
    },
    uiState: {
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
    modalElements: {
      container: document.querySelector('.modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      btnsClose: document.querySelectorAll('.close'),
      btnFullArticle: document.querySelector('.full-article'),
    },
  };
  const watchedState = onChange(state, view(state, elements, i18nextInstance));

  const getPosts = (inputedUrl) => {
    const encoded = encodeURIComponent(inputedUrl);
    const disabledCacheUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encoded}`;
    return axios.get(disabledCacheUrl)
      .catch((err) => {
        watchedState.form.status = 'error';
        watchedState.form.processErrors.networkError = err;
        throw err;
      })
      .then((response) => {
        const doc = parse(response.data.contents);
        const feed = normalizeFeed(doc);
        const posts = normalizePosts(doc, feed.id);
        return { feed, posts };
      })
      .catch((err) => {
        watchedState.form.status = 'error';
        watchedState.form.processErrors.invalidRSS = { err };
      });
  };

  const checkNewPosts = () => {
    watchedState.form.rssUrls.forEach(({ url, feedId }) => {
      getPosts(url)
        .then((newContent) => {
          newContent.posts.forEach(({ post, postUi }) => {
            const alreadyExists = watchedState.content.posts
              .find((oldPost) => oldPost.link === post.link);
            if (!alreadyExists) {
              post.feedId = feedId;
              watchedState.content.posts.push(post);
              watchedState.uiState.posts.push(postUi);
            }
          });
        });
    });
  };
  yup.setLocale({
    string: {
      isUnique: i18nextInstance.t('feedbackMessage.alreadyExists'),
      url: i18nextInstance.t('feedbackMessage.invalidUrl'),
    },
  });

  const isUnique = (url) => {
    const urls = watchedState.form.rssUrls.map((item) => item.url);
    return !urls.includes(url);
  };
  const schema = yup.object({
    url: yup.string().url()
      .test('isUnique', i18nextInstance.t('feedbackMessage.alreadyExists'), (value) => isUnique(value))
      .required(),
  });

  const validate = (field) => schema.validate(field, { abortEarly: false })
    .then(() => {})
    .catch((e) => _.keyBy(e.inner, 'path'));

  setTimeout(function run() {
    checkNewPosts();
    setTimeout(run, 5000);
  }, 5000);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.status = 'sending';
    watchedState.form.processErrors.networkError = null;

    const { value } = elements.input;
    validate({ url: value })
      .then((error) => {
        watchedState.form.validationErrors = { error };
        if (!_.isEmpty(watchedState.form.validationErrors.error)) {
          throw error;
        }
      })
      .then(() => getPosts(value))
      .then((content) => {
        watchedState.form.rssUrls.push({ url: value, feedId: content.feed.id });
        watchedState.content.lastAddedFeed = content.feed;
        watchedState.content.feeds.push(content.feed);
        content.posts.forEach(({ post, postUi }) => {
          watchedState.content.posts.push(post);
          watchedState.uiState.posts.push(postUi);
        });
        watchedState.form.status = 'success';
      })
      .catch(() => {
        watchedState.form.status = 'error';
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
