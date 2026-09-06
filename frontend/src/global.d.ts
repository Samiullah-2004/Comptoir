import { Object3DNode } from '@react-three/fiber'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>
    meshLineMaterial: Object3DNode<MeshLineMaterial, typeof MeshLineMaterial>
  }
}

declare module '*.glb' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}