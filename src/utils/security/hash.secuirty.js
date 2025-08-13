import bcrypt from "bcryptjs";

export const generateHash = async ({plainText = "" , saltRound = process.env.SALT}={})=>{
    return bcrypt.hashSync(plainText , parseInt(saltRound))
}

export const compareHash = async ({plainText = "" , hashValue = ""}={})=>{
    return bcrypt.compareSync(plainText , hashValue)
}