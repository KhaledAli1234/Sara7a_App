import CryptoJS from "crypto-js"
import crypto from "crypto";



export const generateEncryotion = async ({plainText = "" , secretKey = process.env.ENCRYPTION_SECRET}={})=>{
    return CryptoJS.AES.encrypt(plainText , secretKey).toString()
}

export const decryptEncryption = async ({cipherText = "" , secretKey = process.env.ENCRYPTION_SECRET}={})=>{
    return CryptoJS.AES.decrypt(cipherText , secretKey).toString(CryptoJS.enc.Utf8)
}

export const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString(); 
};


