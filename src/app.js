import * as yup from 'yup';
import onChange from 'on-change';
import view from './view.js';
import _ from 'lodash';


// const routes = {}

const networkError = () => 'Network Problems. Try again.';

const app = () => {
    const state = {
        form: {
            field: {
                url: '',
            },
            status: 'initial',
            feedUrls: [],
            errors: {},
            processErrors: null,
        },
    };
    
    const schema = yup.object().shape({
        url: yup.string().notOneOf(state.form.feedUrls).required()
    });
    
    const validate = (field) => schema.validate(field, { abortEarly: false })
        .then(() => {})
        .catch((e) => _.keyBy(e.inner, 'path'));

    const elements = {
        input: document.getElementById('url-input'),
        submit: document.getElementById('rss-submit'),
        form: document.querySelector('form'),
        //add feeds
    }

    const watchState = onChange(state, view(elements));

    elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const { value } = e.target;
        watchState.form.field.url = value;
        validate(watchState.form.field)
        .then((error) => watchState.form.errors = { error })

        if (!_.isEmpty(watchState.form.errors)) {
            watchState.form.status = 'error';
            return;
        }
        watchState.form.feedUrls.push(value);
        watchState.form.status = 'success';
        elements.form.reset();
        elements.input.focus();
    });
}

export default app;