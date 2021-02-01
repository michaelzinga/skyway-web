// const Peer = window.Peer;
// const Peer = require('skyway-js');
// const peer = new Peer({key: 'ebd5349b-10aa-4435-8de0-0b2f303e88d7'});

// import
import Peer from 'skyway-js';
const peer = new Peer({
  key: 'ebd5349b-10aa-4435-8de0-0b2f303e88d7',
  debug: 3
});


(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const localText = document.getElementById('js-local-text');
  const connectTrigger = document.getElementById('js-connect-trigger');
  const localId = document.getElementById('js-local-id');
  const sendTrigger = document.getElementById('js-send-trigger');
  const callTrigger = document.getElementById('js-call-trigger');
  const closeTrigger = document.getElementById('js-close-trigger');
  const remoteVideo = document.getElementById('js-remote-stream');
  const remoteId = document.getElementById('js-remote-id');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  peer.on('open', () => {
    document.getElementById('my-id').textContent = peer.id;
    console.log("あなたのpeerIDは",peer.id)
});

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  connectTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

  // Register caller handler
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId.value, localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  peer.once('open', id => (localId.textContent = id));

  // Register callee handler
  peer.on('call', mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });
  const dataConnection = peer.connect(remoteId.value);

  dataConnection.once('open', async () => {
    messages.textContent += `=== DataConnection has been opened ===\n`;

    sendTrigger.addEventListener('click', onClickSend);
  });

  dataConnection.on('data', data => {
    messages.textContent += `Remote: ${data}\n`;
    console.log("緯度経度のデータはこっち？",data)

  });

  dataConnection.once('close', () => {
    messages.textContent += `=== DataConnection has been closed ===\n`;
    sendTrigger.removeEventListener('click', onClickSend);
  });

  // Register closing handler
  closeTrigger.addEventListener('click', () => dataConnection.close(true), {
    once: true,
  });

  function onClickSend() {
    const data = localText.value;
    dataConnection.send(data);

    messages.textContent += `You: ${data}\n`;
    localText.value = '';
  }
});

function onOpen() {
  console.log("着信しました！");
}
// 着信イベントを検知するイベントリスナを設置
peer.on("open", onOpen);

// イベントリスナを削除
peer.off("open", onOpen);

peer.connect("peerId");


peer.once('open', id => (localId.textContent = id));

// Register connected peer handler
peer.on('connection', dataConnection => {
  dataConnection.once('open', async () => {
    messages.textContent += `=== DataConnection has been opened ===\n`;

    sendTrigger.addEventListener('click', onClickSend);
  });

  dataConnection.on('data', data => {
    messages.textContent += `Remote: ${data}\n`;
    console.log("緯度経度のデータはこれ",data)
  });

  dataConnection.once('close', () => {
    messages.textContent += `=== DataConnection has been closed ===\n`;
    sendTrigger.removeEventListener('click', onClickSend);
  });

  // Register closing handler
  closeTrigger.addEventListener('click', () => dataConnection.close(true), {
    once: true,
  });

  function onClickSend() {
    const data = localText.value;
    dataConnection.send(data);

    messages.textContent += `You: ${data}\n`;
    localText.value = '';
  }
});
  peer.on('error', console.error);
})();
