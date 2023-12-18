import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import _, { uniqueId } from 'lodash';
import i18next from 'i18next';
import view from './view.js';
import resources from './locales/index.js';

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Parsing Error');
  }

  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;
  const posts = [...doc.querySelectorAll('item')]
    .map((item) => {
      const post = {
        title: item.querySelector('title').textContent,
        link: item.querySelector('link').textContent,
        description: item.querySelector('description').textContent,
      };

      return post;
    });
  return { title, description, posts };
};

const app = (i18nextInstance) => {
  const state = {
    form: {
      status: 'filling',
      rssUrls: [],
      validationErrors: {},
      processErrors: {
        networkError: null,
        parsingError: null,
        invalidRSS: {},
      },
    },
    modal: {},
    content: {
      feeds: [],
      posts: [],
    },
    uiState: {
      modalShow: false,
      visitedPosts: [],
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

  const originUrlProxy = (url) => {
    const encoded = encodeURIComponent(url);
    return `https://allorigins.hexlet.app/get?disableCache=true&url=${encoded}`;
  };
  const getPosts = (inputedUrl) => {
    const originURL = originUrlProxy(inputedUrl);
    return axios
      .get(originURL)
      .then((response) => {
        const feed = parse(response.data.contents);
        feed.id = uniqueId();
        feed.posts.forEach((post) => {
          post.id = uniqueId();
          post.feedId = feed.id;
        });
        return feed;
      })
      .catch((err) => {
        throw err;
      });
  };

  const checkNewPosts = () => {
    const promises = watchedState.form.rssUrls.map(({ url, feedId }) => {
      getPosts(url)
        .then((newContent) => {
          newContent.posts.forEach((post) => {
            const alreadyExists = watchedState.content.posts.find(
              (oldPost) => oldPost.link === post.link,
            );
            if (!alreadyExists) {
              post.feedId = feedId;
              watchedState.content.posts.push(post);
            }
          });
        })
        .catch((e) => {
          console.log(e);
        });
    });
    return Promise.all(promises);
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
    url: yup
      .string()
      .url()
      .test(
        'isUnique',
        i18nextInstance.t('feedbackMessage.alreadyExists'),
        (value) => isUnique(value),
      )
      .required(),
  });

  const validate = (field) => schema
    .validate(field, { abortEarly: false })
    .then(() => {})
    .catch((e) => _.keyBy(e.inner, 'path'));

  setTimeout(function run() {
    checkNewPosts()
      .then(() => {
        setTimeout(run, 5000);
      });
  }, 5000);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.status = 'sending';
    watchedState.form.processErrors.networkError = null;
    watchedState.form.processErrors.parsingError = null;

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
        const {
          title, description, id, posts,
        } = content;
        watchedState.form.rssUrls.push({ url: value, feedId: id });
        watchedState.content.feeds.push({ title, description, id });
        watchedState.content.posts.push(...posts);
        watchedState.form.status = 'success';
      })
      .catch((err) => {
        watchedState.form.status = 'error';
        if (err.message === 'Network Error') {
          watchedState.form.processErrors.networkError = { err };
        } else if (err.message === 'Parsing Error') {
          watchedState.form.processErrors.invalidRSS = { err };
        }
      });
  });

  elements.posts.addEventListener('click', (e) => {
    const clickedLink = e.target.closest('.list-posts-item > a');
    if (clickedLink) {
      watchedState.uiState.visitedPosts.push(clickedLink.dataset.id);
      return;
    }

    const clickedButton = e.target.closest('.button-show-more');
    if (clickedButton) {
      const currentPost = watchedState.content.posts.find(
        (post) => post.id === clickedButton.dataset.id,
      );
      const { title, description, link } = currentPost;
      watchedState.modal = { title, description, link };
      watchedState.uiState.modalShow = true;
      watchedState.uiState.visitedPosts.push(currentPost.id);
    }
  });

  elements.modalElements.btnsClose.forEach((btn) => {
    btn.addEventListener('click', () => {
      watchedState.uiState.modalShow = false;
    });
  });
  elements.modalElements.container.addEventListener('click', (e) => {
    if (!e.target.closest('.modal-content')) {
      watchedState.uiState.modalShow = false;
    }
  });
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => app(i18nextInstance));
};
