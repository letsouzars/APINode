const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const port = 3000;

// Chave de criptografia e API
const API_KEY = '1234567890abcdef';
const ENCRYPTION_KEY = crypto.randomBytes(32); // Gera uma chave de 32 bytes para AES-256
const IV_LENGTH = 16; // Comprimento do vetor de inicialização para AES

// Middleware para permitir o parsing de JSON nas requisições
app.use(express.json());
app.use(cors());

// Middleware de autenticação de chave de API
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    return res.status(401).json({ message: 'Chave de API ausente.' });
  }
  if (apiKey !== API_KEY) {
    return res.status(403).json({ message: 'Chave de API inválida.' });
  }
  next();
};

app.use(authenticateAPIKey);

// Função para criptografar uma mensagem
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Retorna o IV e a mensagem criptografada
};

// Função para descriptografar uma mensagem
const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Endpoint para criptografar uma mensagem
app.post('/encrypt', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Mensagem ausente.' });
    const encryptedMessage = encrypt(message);
    res.status(200).json({ encryptedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criptografar a mensagem.' });
  }
});

// Endpoint para descriptografar uma mensagem
app.post('/decrypt', (req, res) => {
  try {
    const { encryptedMessage } = req.body;
    if (!encryptedMessage) return res.status(400).json({ message: 'Mensagem criptografada ausente.' });
    const decryptedMessage = decrypt(encryptedMessage);
    res.status(200).json({ decryptedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao descriptografar a mensagem.' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
