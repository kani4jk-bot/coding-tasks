export interface Point {
  x: number
  y: number
  type: 'foreground' | 'background'
}

export interface Box {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export interface EditResult {
  edited_image: string // data:image/png;base64,...
  mask: string         // data:image/png;base64,...
  timestamp: string
}

export type RootStackParamList = {
  Capture: undefined
  Editor: { imageUri: string; imageWidth: number; imageHeight: number }
  Result: { original: string; edited: EditResult }
}
