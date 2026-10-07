declare module 'bwip-js' {
  export interface BwipOptions {
    bcid: string;
    text: string;
    scale?: number;
    padding?: number;
    includetext?: boolean;
    backgroundcolor?: string;
    barcolor?: string;
    [key: string]: unknown;
  }

  export function toSVG(options: BwipOptions): string;
  export function toBuffer(options: BwipOptions): Promise<Uint8Array>;

  const bwipjs: {
    toSVG: (options: BwipOptions) => string;
    toBuffer: (options: BwipOptions) => Promise<Uint8Array>;
    [key: string]: unknown;
  };

  export default bwipjs;
}
