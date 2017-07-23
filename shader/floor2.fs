#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

#define PI 3.14159265

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const vec3 black = vec3(0,0,0);
const vec3 RIGHT = vec3(1.0, 0.0, 0.0);
const vec3 UP = vec3(0.0, 1.0, 0.0);
const vec3 BACK = vec3(0.0, 0.0, 1.0);

const float EP = 0.001;
const float GP = 1000000.0;

struct Camera {
	vec3 up;
	vec3 from;
	vec3 to;
};
	
struct Floor {
	vec3 zeroPoint;
	vec3 normal;
	vec3 color;
	vec3 specularColor;
};
	
struct Box {
	vec3 center;
	vec3 size;
	vec3 color;
	vec3 specularColor;
};
	
struct Rectangle {
	vec3 center;
	float width;
	float height;
	vec3 normal;
	vec3 up;
	vec3 right;
	vec3 color;
	vec3 specularColor;
};
	
struct Light {
	vec3 position;
	vec3 color;
	float power;
};
	
struct DirectionalLight {
	vec3 dir;
	vec3 color;
	float intensity;
};
	
struct Ray{
	vec3 origin;
	vec3 dir;
};
	
struct Film{
	float w;
	float h;
	float dist;
};
	
struct Sphere {
	vec3 center;
	float radius;
	vec3 color;
	vec3 specularColor;
};
	
struct Hit {
	bool isHit;
	vec3 hitPoint;
	float hitDistance;
	vec3 normal;
	vec3 fromVec;
	vec3 color;
	vec3 specularColor;
};		

// 無限平面との交差
bool intersectFloor(Ray ray, Floor f, inout Hit firstHit){
	Hit hit;
	hit.isHit = true;
	float d = dot(ray.dir, f.normal);

	hit.hitDistance = dot(f.zeroPoint - ray.origin, f.normal) / d;
	hit.hitPoint = ray.origin + hit.hitDistance * ray.dir;
	hit.normal = f.normal;
	hit.fromVec = ray.dir;
	hit.color = f.color;
	hit.specularColor = f.specularColor;
	
	if(hit.hitDistance < 0.0){
		return false;
	}
	
	if (firstHit.isHit && firstHit.hitDistance < hit.hitDistance){
		return false;
	}
	
	// 裏側
	if(d > 0.0){
		hit.normal = -f.normal;
	}
	
	firstHit = hit;
	return true;
}

bool intersectRectangle(Ray ray, Rectangle rect, inout Hit firstHit){
	Hit hit;
	hit.isHit = false;
	
	Floor f;
	f.zeroPoint = rect.center;
	f.normal = rect.normal;
	
	if(!intersectFloor(ray, f, hit) || (firstHit.isHit && hit.hitDistance > firstHit.hitDistance)){
		return false;
	}
	
	
	// 無限平面で当たる場合は範囲調べる
	vec3 hitFromCenter = hit.hitPoint - rect.center;
	float w = dot(hitFromCenter, rect.right) / rect.width * 2.0;
	float h = dot(hitFromCenter, rect.up) / rect.height * 2.0;
	
	if (abs(w) > 1.0 || abs(h) > 1.0) {
		return false;					
	}

	
	firstHit = hit;
	return true;
}

// box交差
bool intersectBox(Ray ray, Box box, inout Hit firstHit){
	Hit hit;
	hit.isHit = false;
	Rectangle rect;
	
	// 前後ろ
	
	rect.width = box.size[0];
	rect.height = box.size[1];
	rect.up = UP;
	rect.right = RIGHT;
	rect.normal = BACK;
	rect.width = box.size[0];
	rect.height = box.size[1];
	rect.center = box.center + vec3(0.0, 0.0, box.size[2] / 2.0);
	intersectRectangle(ray, rect, hit);
	
	rect.normal = - BACK;
	rect.center = box.center + vec3(0.0, 0.0, - box.size[2] / 2.0);
	intersectRectangle(ray, rect, hit);
	
	// 左右
	rect.width = box.size[2];
	rect.height = box.size[1];
	rect.up = UP;
	rect.right = BACK;
	rect.normal = RIGHT;
	rect.width = box.size[2];
	rect.height = box.size[1];
	rect.center = box.center + vec3( box.size[0] / 2.0, 0.0, 0.0);
	intersectRectangle(ray, rect, hit);
	
	rect.normal =  - RIGHT;
	rect.center = box.center + vec3(- box.size[0] / 2.0, 0.0, 0.0);
	intersectRectangle(ray, rect, hit);
	

	// 上下
	rect.width = box.size[0];
	rect.height = box.size[2];
	rect.up = BACK;
	rect.right = RIGHT;
	rect.normal = UP;
	rect.width = box.size[0];
	rect.height = box.size[2];
	rect.center = box.center + vec3(0.0, box.size[1] / 2.0, 0.0);
	intersectRectangle(ray, rect, hit);
	
	rect.normal = - UP;
	rect.center = box.center + vec3(0.0, - box.size[1] / 2.0, 0.0);
	intersectRectangle(ray, rect, hit);
	
	if(!hit.isHit){
		return false;
	}
	
	if (firstHit.isHit && firstHit.hitDistance < hit.hitDistance){
		return false;
	}
	
	hit.color = box.color;
	hit.specularColor = box.specularColor;
	firstHit = hit;

	return true;
}


bool intersectSphere(Ray ray, Sphere sphere, inout Hit firstHit){
	Hit hit;
	
	vec3 centerDash = sphere.center - ray.origin;
	
	float a = dot(ray.dir, ray.dir);
	float b = 2.0 * dot(ray.dir, - centerDash);
	float c = dot(centerDash, centerDash) - sphere.radius * sphere.radius;
	float d = b * b - 4.0 * a * c;
	
	if(d < 0.0){
		return false;
	}
	
	float t1 = (- b - sqrt(d)) / (2.0 * a);
	float t2 = (- b + sqrt(d)) / (2.0 * a);
		
	// 2つともrayの後方
	if( t2 < 0.0 ) {
		return false;
	
	// t2のみrayの前方 # TODO いらないかも
	}else if(t1 < 0.0){
		
		hit.hitDistance = t2;
		hit.hitPoint = ray.origin + t2 * ray.dir;
		hit.normal = normalize(hit.hitPoint - sphere.center);
		hit.color = sphere.color;
		
		hit.color = black;
	// どちらも前方
	}else{
		hit.hitDistance = t1;
		hit.hitPoint = ray.origin + t1 * ray.dir;
		hit.normal = normalize(hit.hitPoint - sphere.center);
		hit.color = sphere.color;
		hit.specularColor = sphere.specularColor; 
	}
	hit.isHit = true;
	hit.fromVec = ray.dir;
		
	if(firstHit.isHit && hit.hitDistance > firstHit.hitDistance){
		return false;
	}
	
	firstHit = hit;
	return true;		
}

Ray generateCameraRay(Camera camera, Film film, vec2 pixel){
	Ray ray;
	ray.origin = camera.from;
	//calculate camera coordinates in world corrdinates
	vec3 u,v,w;
	w = normalize(camera.from - camera.to);
	u = normalize(cross(camera.up, w));
	v = cross(w, u);
	
	//calculate location of pixel in camera coordinates
	vec3 pos_on_film;
	pos_on_film.x = - film.w * (pixel.x + 0.5) / resolution.x + film.w / 2.0;
	pos_on_film.y = - film.h * (pixel.y + 0.5) / resolution.y + film.h / 2.0;
	pos_on_film.z = film.dist;
	
	//calculate location of pixel in world coordinates
	vec3 pos_world = pos_on_film.x * u + pos_on_film.y * v + pos_on_film.z * w + ray.origin;
	
	ray.dir= normalize(ray.origin - pos_world);
	
	return ray;
}	


//	n: should be normalized
// 反射した位置での光強度取得	
vec3 getColorInReflection(Hit hit, Light light){
	
	vec3 toVec = normalize(light.position - hit.hitPoint);
	
	float cos = dot(hit.normal, toVec);
	
	// 自身がライトの間にはいっている
	if(cos < 0.0){
		return black;
	}
	
	float dist = length(light.position - hit.hitPoint);
	
	// ハイライト(鏡面反射)
	vec3 specularColor = black;
	vec3 highEstVec = hit.fromVec - 2.0 * dot(hit.fromVec, hit.normal) * hit.normal;
	float highEst = dot(toVec, highEstVec);
	float highLimit =  1.0 - 0.01 / dist / dist;
	if(highEst > highLimit){
		specularColor = hit.specularColor * highEst/ highLimit;
	}
	
	
	
	return light.power * light.color * cos * (hit.color  / dist / dist + specularColor);
}

vec3 getDirectionalLightColor(Hit hit, DirectionalLight light){
	float cos = dot(hit.normal, - light.dir);
	return light.intensity * light.color * cos * hit.color;
}

void main( void ) {
	//initialization
	
	// camera
	float cameraRadius = 7.0;
	float theta = (mouse.x - 0.5) * PI;
	float phai = (mouse.y - 0.5) * PI;
	Camera camera;
	camera.up = vec3(0.0, 1.0, 0.0);
	camera.from = vec3(cameraRadius * sin(theta) * cos(phai) , cameraRadius * sin(phai) , cameraRadius * cos(theta) * cos(phai));
	camera.to = vec3(0.0, 0.0, 0.0);
	
	// light
	Light light;
	light.position = vec3(0.0, 0.9, 1.0); 
	light.color = vec3(1.0, 0.96, 0.76);
	light.power = 2.0;
	
	DirectionalLight dirLight1;
	dirLight1.dir = normalize(vec3(-0.6, -0.2, 0.1));
	dirLight1.color = vec3(0.7, 0.66, 1.0);
	dirLight1.intensity = 0.9;
	
	
	Sphere lightPoint;
	lightPoint.center = light.position;
	lightPoint.radius = 0.03;
	lightPoint.color = light.color;
	
	// film
	Film film;
	film.w = 5.0;
	film.h = film.w / resolution.x * resolution.y;
	film.dist = 5.0;
	
	//make ray
	Ray ray = generateCameraRay(camera, film, gl_FragCoord.xy);
	
	// floor
	Floor floor1;
	floor1.zeroPoint = vec3(0, 0, 0);
	floor1.normal = vec3(0, 3.0/5.0, 4.0/5.0);
	floor1.color = vec3(1.0, 1.0, 1.0);
	floor1.specularColor = vec3(0.04, 0.04, 0.04);
	
	// mirror
	Rectangle mirror1;
	mirror1.center = vec3(0.1, 0.1, -1.0);
	mirror1.width = 10.0;
	mirror1.height = 10.0;
	mirror1.up = UP;
	mirror1.right = RIGHT;
	mirror1.normal = BACK;
	mirror1.color = vec3(1.0, 1.0, 1.0);
	
	// spheres
	const int shpereCount = 4;
	Sphere spheres[shpereCount];
	
	spheres[0].color = vec3(0.7, 0.2, 0.1);
	spheres[0].specularColor = spheres[0].color; 
	spheres[0].center = vec3(0.3, 0.2, 0.1); 
	spheres[0].radius = 0.2;
	
	spheres[1].color = vec3(0.1, 0.8, 0.1);
	spheres[1].specularColor = spheres[1].color; 
	spheres[1].center = vec3(-0.3, 0.8, 0.1);
	spheres[1].radius = 0.3;
	
	spheres[2].color = vec3(0.2, 0.2, 0.9);
	spheres[2].specularColor = spheres[2].color; 
	spheres[2].center = vec3(1.9, 1.0, -0.2);
	spheres[2].radius = 0.4;
	
	float t3 = 1.0;
	spheres[3].color = vec3(0.2, 0.9, 0.9);
	spheres[3].specularColor = spheres[3].color; 
	spheres[3].center = vec3(1.0*cos(time/t3), 1.0*sin(time/t3) + 2.0, -0.2);
	spheres[3].radius = 0.4;
	
	// Boxes
	const int boxCount = 1;
	Box boxes[boxCount];
	boxes[0].center = vec3(0.8, 1.2, -0.3);
	boxes[0].size = vec3(0.5, 0.5, 0.5);
	boxes[0].color = vec3(0.53, 0.2, 0.15);
	boxes[0].specularColor = vec3(0.23, 0.13, 0.1);
	
	Hit firstHit;
	firstHit.isHit = false;

	
	for(int i = 0; i < shpereCount; i++){
		intersectSphere(ray, spheres[i], firstHit);
	}
	for(int i = 0; i < boxCount; i++){
		intersectBox(ray, boxes[i], firstHit);
	}
	
	intersectFloor(ray, floor1, firstHit);
	
	// mirror
	if(intersectRectangle(ray, mirror1, firstHit)){
		vec3 n2 = 2.0 * dot(ray.dir, firstHit.normal) * firstHit.normal;
		ray.dir -= n2;
		ray.origin = firstHit.hitPoint + ray.dir * EP;
		firstHit.isHit = false;
	}
	
	// light
	bool isLight = intersectSphere(ray, lightPoint, firstHit);
	
	if (isLight ){
		vec3 color = light.color;
		/*
		float k = dot((light.position - firstHit.hitPoint), ray.dir) / lightPoint.radius;
		float lim = 0.9;
		if(k < lim){
			color *= k;
		}
		*/
		gl_FragColor = vec4(color, 1.0);		
		return;
	}
	
	Ray rayForFloor;
	rayForFloor.origin = firstHit.hitPoint + EP * firstHit.normal;
	rayForFloor.dir = firstHit.normal;
	vec3 objColor = firstHit.color;
	
	// directionalLight
	vec3 colFromLight = getDirectionalLightColor(firstHit, dirLight1);
	
	// 影をつけるため再度rayを飛ばす
	firstHit.hitDistance = GP;
	ray.origin = firstHit.hitPoint + EP * firstHit.normal;
	ray.dir =  normalize(light.position - firstHit.hitPoint); 
	
	for(int i = 0; i < shpereCount; i++){
		intersectSphere(ray, spheres[i], firstHit);
	}
	for(int i = 0; i < boxCount; i++){
		intersectBox(ray, boxes[i], firstHit);
	}
	
	/*
	ray.origin = firstHit.hitPoint + EP * firstHit.normal;
	ray.dir =  normalize(light.position - firstHit.hitPoint); 
	
	for(int i = 0; i < shpereCount; i++){
		intersectSphere(ray, spheres[i], firstHit);
	}
*/
	//intersectFloor(ray, floor1, firstHit);
	colFromLight += getColorInReflection(firstHit, light);
	
	
	
	// 床面からの光
	vec3 colFromFloor;
	firstHit.isHit = false;
	if(intersectFloor(rayForFloor, floor1, firstHit)){
		firstHit.color *= objColor  * 0.3;
		colFromFloor = getColorInReflection(firstHit, light);
		//colFromFloor = firstHit.color * 2.0;
	}
	
	gl_FragColor = vec4(colFromLight + colFromFloor, 1.0);
}