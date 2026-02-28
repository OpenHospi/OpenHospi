declare module "heic-decode" {
  interface DecodeResult {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  function decode(input: { buffer: Uint8Array }): Promise<DecodeResult>;
  export default decode;
}
