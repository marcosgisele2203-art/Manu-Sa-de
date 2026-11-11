(async () => {
  const form = document.getElementById('setup-form'),
    error = document.getElementById('setup-error'),
    button = document.getElementById('setup-submit');
  let user;
  try {
    user = (await Manu.request('/api/auth/me')).user;
    const offices = (await Manu.request('/api/offices')).offices;
    if (offices.length) {
      location.replace('painel.html?consultorio=' + encodeURIComponent(offices[0].id));
      return;
    }
  } catch (e) {
    if (e.status === 401) {
      location.replace('conta.html?voltar=boas-vindas.html');
      return;
    }
    document.getElementById('setup-loading').textContent = e.message;
    return;
  }
  document.getElementById('setup-loading').hidden = true;
  document.getElementById('setup-greeting').textContent = 'Olá, ' + user.name.split(' ')[0] + '!';
  form.elements.office.value = ('Consultório ' + user.name).slice(0, 100);
  form.hidden = false;
  form.onsubmit = async (e) => {
    e.preventDefault();
    error.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    if (data.start >= data.end) {
      error.textContent = 'O horário final precisa ser posterior ao horário inicial.';
      return;
    }
    if (data.phone.replace(/\D/g, '').length < 10) {
      error.textContent = 'Informe o telefone com DDD.';
      return;
    }
    button.disabled = true;
    try {
      const result = await Manu.request('/api/onboarding', { method: 'POST', body: JSON.stringify(data) });
      form.hidden = true;
      document.getElementById('setup-success').hidden = false;
      document.getElementById('start-panel').href = 'painel.html?consultorio=' + encodeURIComponent(result.id);
    } catch (e) {
      error.textContent = e.message;
      button.disabled = false;
    }
  };
})();
