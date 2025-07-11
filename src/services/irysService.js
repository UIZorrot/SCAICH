// 使用全局 WebIrys 变量（通过 CDN 加载）
class IrysService {
  constructor() {
    this.irys = null;
    this.wallet = null;
    this.RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=3ba5d042-cc72-4f2b-b26e-8db8d298aa10';
  }

  checkSDKAvailability() {
    if (typeof window === 'undefined' || !window.WebIrys) {
      throw new Error('Irys SDK not loaded. Please ensure the page has loaded completely.');
    }
    return window.WebIrys;
  }

  async connectWallet() {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.');
      }

      const response = await window.solana.connect();
      this.wallet = window.solana;

      return response.publicKey.toString();
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async initializeIrys() {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      // 检查 SDK 可用性
      const WebIrys = this.checkSDKAvailability();

      // Convert public key to Solana PublicKey object
      const publicKey = new window.solanaWeb3.PublicKey(this.wallet.publicKey.toString());

      console.log('Creating Irys instance...');
      // Initialize Irys with Solana provider
      this.irys = await WebIrys.WebUploader(WebIrys.WebSolana)
        .withProvider({
          provider: this.wallet,
          publicKey: publicKey,
          signMessage: async (msg) => {
            console.log('Signing message:', msg);
            const signedMessage = await this.wallet.signMessage(msg);
            console.log('Signed message:', signedMessage);
            return signedMessage.signature || signedMessage;
          },
          sendTransaction: async (tx) => {
            console.log('Sending transaction:', tx);
            const { signature } = await this.wallet.signAndSendTransaction(tx);
            console.log('Transaction signature:', signature);
            return signature;
          }
        })
        .withRpc(this.RPC_ENDPOINT);

      console.log('Irys instance created:', this.irys);

      // Test connection
      try {
        console.log('Testing Irys connection...');
        await this.irys.getBalance();
        console.log('Irys connection successful');
      } catch (error) {
        console.error('RPC connection test failed:', error);
        throw new Error('RPC connection failed. Please try again later.');
      }

      return this.irys;
    } catch (error) {
      console.error('Irys initialization failed:', error);
      throw error;
    }
  }

  async calculateUploadCost(fileSize) {
    if (!this.irys) {
      throw new Error('Irys not initialized');
    }

    try {
      const price = await this.irys.getPrice(fileSize);
      return price;
    } catch (error) {
      console.error('Failed to calculate upload cost:', error);
      throw error;
    }
  }

  async fundUpload(amount) {
    if (!this.irys) {
      throw new Error('Irys not initialized');
    }

    try {
      await this.irys.fund(amount);
      return true;
    } catch (error) {
      console.error('Failed to fund upload:', error);
      throw error;
    }
  }

  async uploadMetadata(metadata, doi) {
    if (!this.irys) {
      throw new Error('Irys not initialized');
    }

    try {
      const metadataTags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "application/json" },
        { name: "Version", value: "1.0.0" },
        { name: "Type", value: "paper-metadata" },
        { name: "doi", value: doi }
      ];

      if (metadata.title) metadataTags.push({ name: "title", value: metadata.title });
      if (metadata.authors) metadataTags.push({ name: "authors", value: metadata.authors });
      if (metadata.category) metadataTags.push({ name: "category", value: metadata.category });

      const receipt = await this.irys.upload(JSON.stringify(metadata), { tags: metadataTags });
      return receipt;
    } catch (error) {
      console.error('Failed to upload metadata:', error);
      throw error;
    }
  }

  async uploadPDF(file, metadata, doi) {
    if (!this.irys) {
      throw new Error('Irys not initialized');
    }

    try {
      const pdfTags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "application/pdf" },
        { name: "Version", value: "1.0.0" },
        { name: "Type", value: "paper-pdf" },
        { name: "doi", value: doi }
      ];

      if (metadata.title) pdfTags.push({ name: "title", value: metadata.title });
      if (metadata.authors) pdfTags.push({ name: "authors", value: metadata.authors });
      if (metadata.category) pdfTags.push({ name: "category", value: metadata.category });

      const receipt = await this.irys.uploadFile(file, { tags: pdfTags });
      return receipt;
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      throw error;
    }
  }

  async uploadSupplementaryFiles(files, metadata, doi) {
    if (!this.irys) {
      throw new Error('Irys not initialized');
    }

    const receipts = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tags = [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: file.type || "application/octet-stream" },
          { name: "Version", value: "1.0.0" },
          { name: "Type", value: "supplementary-material" },
          { name: "doi", value: doi },
          { name: "filename", value: file.name }
        ];

        if (metadata.title) tags.push({ name: "title", value: metadata.title });

        const receipt = await this.irys.uploadFile(file, { tags });
        receipts.push({
          filename: file.name,
          receipt: receipt
        });
      }

      return receipts;
    } catch (error) {
      console.error('Failed to upload supplementary files:', error);
      throw error;
    }
  }

  generateDOI() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `10.48550/press.${new Date().getFullYear()}.${timestamp}.${random}`;
  }

  async retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  getIrysGatewayUrl(id) {
    return `https://gateway.irys.xyz/${id}`;
  }

  isConnected() {
    return this.wallet && this.irys;
  }

  getWalletAddress() {
    return this.wallet?.publicKey?.toString() || null;
  }
}

const irysService = new IrysService();
export default irysService;
