import { ValueTransformer } from 'typeorm';

/**
 * The `pg` driver returns `numeric`/`decimal` columns as strings to avoid
 * precision loss. These columns are typed as `number` in the entities, so
 * they have to be parsed back on the way out.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null) => value,

  from: (value: string | null) =>
    value === null ? null : Number(value),
};
