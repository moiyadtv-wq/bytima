const sidebar = document.getElementById('sidebarId');

if (localStorage.getItem('isSmall') === 'yes') {
  sidebar.classList.add('small-sidebar');
} else {
  sidebar.classList.remove('small-sidebar');
}

const toggleSidebar = () => {
  if (localStorage.getItem('isSmall') === 'yes') {
    localStorage.setItem('isSmall', 'no');
    sidebar.classList.remove('small-sidebar');
  } else {
    localStorage.setItem('isSmall', 'yes');
    sidebar.classList.add('small-sidebar');
  }
};

function addPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const profileLink = document.querySelector('.dropdown .d-flex.align-items-center');
    let img = profileLink.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.width = 32;
      img.height = 32;
      img.className = 'rounded-circle me-2';
      profileLink.insertBefore(img, profileLink.querySelector('strong'));
    }
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  const img = document.querySelector('.dropdown .d-flex.align-items-center img');
  if (img) img.remove();
}


