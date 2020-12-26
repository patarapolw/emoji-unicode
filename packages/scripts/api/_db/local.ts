import { prop, Entity, primary, Table } from 'liteorm'

@Entity({ name: 'unicode' })
class DbUnicode {
  @primary({ autoincrement: true }) id?: number
  @prop({ unique: true, type: 'int', null: true }) ascii?: number
  @prop({ unique: true }) symbol!: string
  @prop({ null: true }) description?: string
  @prop({ null: true, index: true }) type?: string
  @prop({ null: true }) frequency?: number
}

export const DbUnicodeModel = new Table(DbUnicode)

@Entity({ name: 'repr' })
class DbRepr {
  @prop({ unique: true }) repr!: string
  @prop({ references: DbUnicodeModel }) unicodeId!: number
}

export const DbReprModel = new Table(DbRepr)

export const tb = {
  unicode: DbUnicodeModel,
  repr: DbReprModel
}

export default tb
