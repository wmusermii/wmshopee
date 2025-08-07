import db from '../database/client';
import { customAlphabet } from 'nanoid'
export class UserRepository {
  async findByUsername(username: string) {
    const result = await db.select([
      'mu.iduser',
      'mu.username',
      'mu.password',
      'mu.fullname',
      'mu.mobile',
      'mu.email',
      'mg.groupname',
      'mg.menublob'
    ]).from('m_user as mu').innerJoin("m_group as mg","mu.idgroup","mg.idgroup").where({ "username":username }).first();
    return result;
  }
  async findByUsernamePassword(username: string, password:string) {
    const result = await db.select([
      'mu.iduser',
      'mu.username',
      'mu.password',
      'mu.fullname',
      'mu.mobile',
      'mu.email',
      'mg.groupname',
      'mg.menublob'
    ]).from('m_user as mu').innerJoin("m_group as mg","mu.idgroup","mg.idgroup").where({ "username":username, "password":password }).first();
    return result;
  }
  async registerUser(payload: any) {
    // Buat generator dengan hanya angka dan panjang 9 digit
    const nanoidNumeric = customAlphabet('0123456789', 9);
    // Hanya angka 0-9, panjang 9
    const uid = nanoidNumeric(); // contoh: "102345678"
    const query = await db('m_user').insert(
        {
          iduser: uid+"",
          username: payload.username,
          created_by: uid,
          created_at: new Date().toLocaleString('sv-SE').replace('T', ' '), // ← lokal time,
          idgroup: payload.groupCode,
          fullname:payload.fullname,
          mobile:payload.mobilename,
          email:payload.email,
          password:payload.password
        }
      ).returning("iduser");

    return query;
  }
}
