import { prop, getModelForClass } from '@typegoose/typegoose'

class Entry {
  @prop({ required: true }) charCode!: string
  @prop({ required: true }) code!: string
  @prop({ required: true, unique: true, index: true }) symbol!: string
  @prop({ required: true }) description!: string
  @prop({ default: () => [] }) alt!: string[]
  @prop({ default: () => [] }) hint!: string[]
  @prop({ default: () => [] }) like!: string[]
}

export const EntryModel = getModelForClass(Entry, { schemaOptions: { timestamps: { updatedAt: true } } })
