import { Serializable } from './types';
export declare abstract class TypeDescriptor {
    readonly ctor: Function;
    protected constructor(ctor: Function);
    getTypes(): Array<Function>;
    hasFriendlyName(): boolean;
}
export type Typelike = TypeDescriptor | Function;
export declare class ConcreteTypeDescriptor extends TypeDescriptor {
    constructor(ctor: Function);
}
export declare abstract class GenericTypeDescriptor extends TypeDescriptor {
    protected constructor(ctor: Function);
}
export declare class ArrayTypeDescriptor extends GenericTypeDescriptor {
    readonly elementType: TypeDescriptor;
    constructor(elementType: TypeDescriptor);
    getTypes(): Array<Function>;
}
export declare function ArrayT(elementType: Typelike): ArrayTypeDescriptor;
export declare class SetTypeDescriptor extends GenericTypeDescriptor {
    readonly elementType: TypeDescriptor;
    constructor(elementType: TypeDescriptor);
    getTypes(): Array<Function>;
}
export declare function SetT(elementType: Typelike): SetTypeDescriptor;
export declare const enum MapShape {
    /**
     * A map will be serialized as an array of {key: ..., value: ...} objects.
     */
    ARRAY = 0,
    /**
     * A map will be serialized as a JSON object.
     */
    OBJECT = 1
}
export interface MapOptions {
    /**
     * How the map should be serialized. Default is ARRAY.
     */
    shape: MapShape;
}
export declare class MapTypeDescriptor extends GenericTypeDescriptor {
    readonly keyType: TypeDescriptor;
    readonly valueType: TypeDescriptor;
    readonly options?: Partial<MapOptions> | undefined;
    constructor(keyType: TypeDescriptor, valueType: TypeDescriptor, options?: Partial<MapOptions> | undefined);
    getTypes(): Array<Function>;
    getCompleteOptions(): MapOptions;
}
export declare function MapT(keyType: Typelike, valueType: Typelike, options?: Partial<MapOptions>): MapTypeDescriptor;
export declare const AnyT: ConcreteTypeDescriptor;
export type TypeThunk = () => Serializable<any> | TypeDescriptor;
export type MaybeTypeThunk = Serializable<any> | TypeDescriptor | TypeThunk;
export declare function isTypelike(type: any): type is Typelike;
export declare function isTypeThunk(candidate: any): candidate is TypeThunk;
export declare function ensureTypeDescriptor(type: Typelike): TypeDescriptor;
export declare function ensureTypeThunk(typeThunkOrSerializable: MaybeTypeThunk | null | undefined, decoratorName: string): TypeThunk;
//# sourceMappingURL=type-descriptor.d.ts.map