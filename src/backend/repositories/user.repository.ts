import db from '../database/client';

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
}
