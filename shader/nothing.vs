 // 頂点シェーダには一切手入れする必要なし
attribute vec3 position;
void main(void){
	gl_Position = vec4(position, 1.0);
}