//add is-invalid class
const errorHandler = (alert, elements) => {
  const errorMessage = alert.error.url !== undefined
  ? alert.error.url.message
  : alert.error.url;
  console.log(alert.error)
  if (errorMessage) {
    
    elements.input.classList.add('is-invalid');
  } else {
    elements.input.classList.remove('is-invalid');
  }
  const feedbackPart = document.querySelector('.feedback');
  
}

const initView = (elements) => (path, value) => {
    switch (path) {
        case 'form.errors':
            errorHandler(value, elements);
            break;
    }

}

export default initView;