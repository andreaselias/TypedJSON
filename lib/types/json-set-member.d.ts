import { CustomDeserializerParams, CustomSerializerParams } from './metadata';
import { OptionsBase } from './options-base';
import { MaybeTypeThunk } from './type-descriptor';
export interface IJsonSetMemberOptions extends OptionsBase {
    /** When set, indicates that the member must be present when deserializing. */
    isRequired?: boolean | null;
    /** When set, a default value is emitted for each uninitialized json member. */
    emitDefaultValue?: boolean | null;
    /** When set, the key on the JSON that should be used instead of the class property name */
    name?: string | null;
    /**
     * When set, this deserializer will be used to deserialize the member. The callee must assure
     * the correct type.
     */
    deserializer?: ((json: any, params: CustomDeserializerParams) => any) | null;
    /** When set, this serializer will be used to serialize the member. */
    serializer?: ((value: any, params: CustomSerializerParams) => any) | null;
}
/**
 * Specifies that the property is part of the object when serializing.
 * Use this decorator on properties of type Set<T>.
 * @param maybeTypeThunk Constructor of set elements (e.g. 'Number' for Set<number> or 'Date'
 * for Set<Date>).
 * @param options Additional options.
 */
export declare function jsonSetMember(maybeTypeThunk: MaybeTypeThunk, options?: IJsonSetMemberOptions): (target: Object, propKey: string | symbol) => void;
//# sourceMappingURL=json-set-member.d.ts.map