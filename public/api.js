window.Manu = {
  async request(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    let body;
    try {
      body = await res.json();
    } catch {
      throw Error('O servidor ainda não está atualizado. Implante a versão mais recente no EasyPanel.');
    }
    if (!res.ok) {
      const e = Error(body.error || 'Não foi possível concluir a operação.');
      e.status = res.status;
      throw e;
    }
    return body;
  },
};
/* Diminui a imagem no próprio navegador antes de enviar: fotos de celular e PNGs grandes passam a ser aceitos.
   Lado maior até 800 px, WebP (mantém fundo transparente) ou JPEG com fundo branco se o navegador não gerar WebP.
   O resultado fica abaixo de 500 KB, que é o limite do servidor. */
Manu.encolherImagem = async function (file, lado = 800) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw Error('Escolha uma imagem PNG, JPG ou WebP.');
  if (file.size > 20 * 1024 * 1024) throw Error('Imagem muito grande. Escolha uma de até 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(Error('Não foi possível abrir a imagem. Tente outra.'));
      i.src = url;
    });
    for (const max of [lado, 600, 400]) {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)),
        c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s));
      c.height = Math.max(1, Math.round(img.naturalHeight * s));
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, c.width, c.height);
      for (const q of [0.85, 0.7, 0.55]) {
        let d = c.toDataURL('image/webp', q);
        if (!d.startsWith('data:image/webp')) {
          const b = document.createElement('canvas');
          b.width = c.width;
          b.height = c.height;
          const h = b.getContext('2d');
          h.fillStyle = '#fff';
          h.fillRect(0, 0, b.width, b.height);
          h.drawImage(c, 0, 0);
          d = b.toDataURL('image/jpeg', q);
        }
        if (d.length <= 680000) return d;
      }
    }
    throw Error('Não foi possível diminuir a imagem. Tente outra.');
  } finally {
    URL.revokeObjectURL(url);
  }
};
