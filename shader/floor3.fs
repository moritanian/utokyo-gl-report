#ifdef GL_ES
precision mediump float;
#endif

//#extension GL_OES_standard_derivatives : enable

#define PI 3.14159265

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const vec3 BLACK= vec3(0,0,0);
const vec3 RIGHT = vec3(1.0, 0.0, 0.0);
const vec3 UP = vec3(0.0, 1.0, 0.0);
const vec3 BACK = vec3(0.0, 0.0, 1.0);

const float EP = 0.001;
const float GP = 1000000.0;

struct Material {
  vec3 diffuseColor; // 乱反射
  float diffuseRate; // 拡散反射率  
  vec3 specularColor; // 全反射
  float specularRate; // 鏡面反射率
  vec3 ambientColor; // 発光
  vec3 transparentColor; // 透過
  float transmittance; // 透過率 
};

struct Camera {
  vec3 up;
  vec3 from;
  vec3 to;
};

struct Floor {
  vec3 zeroPoint;
  vec3 normal;
  Material mat;
};

struct Box {
  vec3 center;
  vec3 size;
  Material mat;
};

struct Rectangle {
  vec3 center;
  float width;
  float height;
  vec3 normal;
  vec3 up;
  vec3 right;
  Material mat;
};

struct SpotLight {
  vec3 position;
  vec3 color;
  float power;
  float radius;
};

struct DirectionalLight {
  vec3 dir;
  vec3 color;
  float intensity;
};

struct Ray{
  vec3 origin;
  vec3 dir;
  float addDistance;
};

struct Film{
  float w;
  float h;
  float dist;
};

struct Sphere {
  vec3 center;
  float radius;
  Material mat;
};

struct Hit {
  bool isHit;
  vec3 hitPoint;
  float hitDistance;
  float addDistance;
  vec3 normal;
  vec3 fromVec;
  Material mat;
};

// scene内
const int SphereCount = 4;
Sphere spheres[SphereCount];
const int BoxCount = 1;
Box boxes[BoxCount];
const int MirrorCount = 2;
Rectangle mirrors[MirrorCount];

SpotLight light;

DirectionalLight dirLight1;

Floor floor1;

float envLightIntensity;

// 無限平面との交差
bool intersectFloor(Ray ray, Floor f, inout Hit firstHit){
  Hit hit;
  hit.isHit = true;
  float d = dot(ray.dir, f.normal);

  hit.hitDistance = dot(f.zeroPoint - ray.origin, f.normal) / d;
  hit.hitPoint = ray.origin + hit.hitDistance * ray.dir;
  hit.normal = f.normal;
  hit.fromVec = ray.dir;
  
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
  
  hit.mat = f.mat;
  hit.addDistance = ray.addDistance;
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

  hit.mat = rect.mat;
  hit.addDistance = ray.addDistance;
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
  rect.up =  UP;
  rect.right = RIGHT;
  rect.normal = BACK;
  rect.width = box.size[0];
  rect.height = box.size[1];
  rect.center = box.center + vec3(0.0, 0.0, box.size[2] / 2.0);
  intersectRectangle(ray, rect, hit);
  
  rect.normal = -BACK;
  rect.center = box.center + vec3(0.0, 0.0, - box.size[2] / 2.0);
  intersectRectangle(ray, rect, hit);
  
  // 左右
  rect.width = box.size[2];
  rect.height = box.size[1];
  rect.up = UP;
  rect.right = BACK;
  rect.normal =  RIGHT;
  rect.width = box.size[2];
  rect.height = box.size[1];
  rect.center = box.center + vec3( box.size[0] / 2.0, 0.0, 0.0);
  intersectRectangle(ray, rect, hit);
  
  rect.normal =  -RIGHT;
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
  
  rect.normal = -UP;
  rect.center = box.center + vec3(0.0, - box.size[1] / 2.0, 0.0);
  intersectRectangle(ray, rect, hit);
  
  if(!hit.isHit){
    return false;
  }
  
  if (firstHit.isHit && firstHit.hitDistance < hit.hitDistance){
    return false;
  }
  
  hit.mat = box.mat;
  hit.addDistance = ray.addDistance;

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
    hit.mat = sphere.mat;

  // どちらも前方
  }else{
    hit.hitDistance = t1;
    hit.hitPoint = ray.origin + t1 * ray.dir;
    hit.normal = normalize(hit.hitPoint - sphere.center);
    hit.mat = sphere.mat;

  }
  hit.isHit = true;
  hit.fromVec = ray.dir;
    
  if(firstHit.isHit && hit.hitDistance > firstHit.hitDistance){
    return false;
  }
  
  hit.addDistance = ray.addDistance;

  firstHit = hit;
  return true;    
}

bool intersectSpotLight(Ray ray, SpotLight sLight, inout Hit firstHit){
    Sphere lightSphere;
    lightSphere.center = sLight.position;
    lightSphere.mat.ambientColor = sLight.color * sLight.power;
    lightSphere.radius = sLight.radius;
    return intersectSphere(ray, lightSphere, firstHit);
}

vec3 getDirectionalLightColor(Hit hit, DirectionalLight dLight){
  float cos = dot(hit.normal, - dLight.dir);
  return dLight.intensity * dLight.color * cos;
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

// return hit
Hit raycast(Ray ray){
  Hit firstHit;
  firstHit.isHit = false;

  // shpere
  for(int i = 0; i < SphereCount; i++){
    intersectSphere(ray, spheres[i], firstHit);
  }
  // box
  for(int i = 0; i < BoxCount; i++){
    intersectBox(ray, boxes[i], firstHit);
  }
  
  intersectFloor(ray, floor1, firstHit);
  
  // mirror
  for (int i=0; i< MirrorCount; i++){
    intersectRectangle(ray, mirrors[i], firstHit);
  }

  // light
  intersectSpotLight(ray, light, firstHit);

  return firstHit;  
}

bool _shadeDiffSpot(inout Ray ray, Hit hit, Material mat, inout vec3 ret){
  // spot light方向
    // カメラから遠方の場合は計算しない
  if(hit.hitDistance > 100.0){
    return false;
  }
  ray.origin = hit.hitPoint + EP * hit.normal;
  ray.dir =  normalize(light.position - hit.hitPoint); 
  float cosN = dot(hit.normal, ray.dir);
  if(cosN <= 0.0){
    return false;
  }
  float allDistance = hit.hitDistance + hit.addDistance;
  ret = mat.diffuseColor * mat.diffuseRate* cosN / allDistance / allDistance;
  return true;
}

bool _shadeDiffFloor(inout Ray ray, Hit hit, Material mat, inout vec3 ret, inout Hit floorHit){
  ray.origin = hit.hitPoint + EP * hit.normal;
  ray.dir = hit.normal;
  if(!intersectFloor(ray, floor1, floorHit)){
    return false;
  }
  float allDistance = hit.hitDistance + hit.addDistance;
  ret = mat.diffuseColor * mat.diffuseRate * dot( - hit.fromVec, hit.normal) / allDistance/ allDistance;
  return true;
}

vec3 _shadeDiffDirLight(Hit hit, Material mat){
  float allDistance = hit.hitDistance + hit.addDistance;
  return  mat.diffuseColor * mat.diffuseRate* (getDirectionalLightColor(hit, dirLight1) / allDistance/ allDistance + vec3(1.0, 1.0, 1.0) * envLightIntensity) ;
}

bool _shadeSpecular(inout Ray ray, Hit hit, Material mat, inout vec3 ret){
  // カメラから遠方の場合は計算しない
  if(hit.hitDistance > 100.0){
    return false;
  }

  vec3 n2 = 2.0 * dot(hit.fromVec, hit.normal) * hit.normal;
  ray.dir = hit.fromVec - n2;
  ray.origin = hit.hitPoint + ray.dir * EP;
  ray.addDistance = hit.hitDistance;
  ret = mat.specularColor * mat.specularRate;// / hit.hitDistance / hit.hitDistance;;
  return true;
}

vec3 _shadeAmbient(Hit hit, Material mat){
  float allDistance = hit.hitDistance + hit.addDistance;
  return mat.ambientColor / allDistance/ allDistance;
}
bool _shadeTransparency(inout Ray ray, Hit hit, Material mat, inout vec3 ret){
  // # TODO 曲げる, 透過色
  vec3 sin2n = cross(cross(hit.normal, hit.fromVec), hit.normal) / 1.2;
  float cos2 = sqrt(1.0 - dot(sin2n, sin2n));

  ray.dir = - hit.normal * cos2 + sin2n ;
  ray.origin = hit.hitPoint + ray.dir * 0.9;
  ret = mat.transparentColor * mat.transmittance;
  return true;
}

vec3 shade3 (Hit hit, Ray oldray){
  if(!hit.isHit){
    return BLACK;
  }

  Material mat = hit.mat;
  Ray ray;

  vec3 color = BLACK;

  // 乱反射
  if( mat.diffuseRate > 0.0){
    // directional light
    color += _shadeDiffDirLight(hit, mat);

  }

  // 発光
  if(mat.ambientColor != BLACK){
    color += _shadeAmbient(hit, mat);
  }

  return color;
}

vec3 shade2 (Hit hit, Ray oldray){
  if(!hit.isHit){
    return BLACK;
  }

  Material mat = hit.mat;
  Ray ray;

  vec3 color = BLACK;
  vec3 ret;
  
  // 乱反射
  if( mat.diffuseRate > 0.0){
    // spot light方向
    if(_shadeDiffSpot(ray, hit, mat, ret)){
      color += ret * shade3(raycast(ray), ray);
    }

    // directional light
    color += _shadeDiffDirLight(hit, mat);

  }

  // 鏡反射
  if(mat.specularRate > 0.0){
    if(_shadeSpecular(ray, hit, mat, ret)){
      color += ret * shade3(raycast(ray), ray);
    }
  }

  // 発光
  if(mat.ambientColor != BLACK){
    color += _shadeAmbient(hit, mat);
  }

  // 透過
  if(mat.transmittance > 0.0){
    if(_shadeTransparency(ray, hit, mat, ret)){
      color += ret * shade3(raycast(ray), ray);
    } 
  }
  
  return color;
}

vec3 shade (Hit hit, Ray oldray){
  if(!hit.isHit){
    return BLACK;
  }

  Material mat = hit.mat;
  Ray ray;
  vec3 ret;

  vec3 color = BLACK;
  // 乱反射
  if( mat.diffuseRate > 0.0){
    // spot light方向
    if(_shadeDiffSpot(ray, hit, mat, ret)){
      color += ret * shade3(raycast(ray), ray); // shade2 ではなく3!
    }
    
    // 床面からの光
    Hit floorHit;
    /*
    if(_shadeDiffFloor(ray, hit, mat, ret, floorHit)){
      color += ret * shade2(floorHit, ray);
    }*/

    // directional light
    color += _shadeDiffDirLight(hit, mat);
  }

  // 鏡反射
  if(mat.specularRate > 0.0){
    if(_shadeSpecular(ray, hit, mat, ret)){
      color += ret * shade2(raycast(ray), ray);
    }
  }

  // 発光
  if(mat.ambientColor != BLACK){
    color += _shadeAmbient(hit, mat);
  }

  // 透過
  if(mat.transmittance > 0.0){
    if(_shadeTransparency(ray, hit, mat, ret)){
      color += ret * shade2(raycast(ray), ray);
    } 
  }

  return color;
}

void initScene(inout Ray ray){
  //initialization
  
  // camera
  float cameraRadius = 7.0;
  float theta = (mouse.x - 0.5) * PI;
  float phai = (mouse.y - 0.3) * PI;
  Camera camera;
  camera.up = vec3(0.0, 1.0, 0.0);
  camera.to = vec3(0.0, 1.8, 0.3);
  camera.from = vec3(cameraRadius * sin(theta) * cos(phai) , cameraRadius * sin(phai), cameraRadius * cos(theta) * cos(phai)) + camera.to;
  
  
  // light
  //Light light;
  //light.position = vec3(0.0, 1.3, 0.1); 
  light.position = vec3(sin(time * 0.9) * 1.0, 2.3 + cos(time*0.7) * 0.1, 0.1 + cos(time * 1.7+ 1.0) * 0.4); 
  light.color = vec3(1.0, 0.96, 0.76);
  light.power = 1200.0;
  light.radius = 0.03;
  
  //DirectionalLight dirLight1;
  dirLight1.dir = normalize(vec3(- 0.5, - 1.0, 0.1));
  dirLight1.color = vec3(0.7, 0.66, 1.0);
  dirLight1.intensity = 100.9;
  
  envLightIntensity = 2.0;

  // film
  Film film;
  film.w = 5.0;
  film.h = film.w / resolution.x * resolution.y;
  film.dist = 5.0;
  
  //make ray
  ray = generateCameraRay(camera, film, gl_FragCoord.xy);
  
  // floor
  floor1.zeroPoint = vec3(0, 0, 0);
  floor1.normal = vec3(0, 3.0/5.0, 4.0/5.0);
  floor1.mat.diffuseColor = vec3(1.0, 1.0, 1.0);
  floor1.mat.diffuseRate = 0.07;
  floor1.mat.specularColor = vec3(0.8, 0.8, 0.8);
  floor1.mat.specularRate = 0.05;
  
  // mirror
  mirrors[0].center = vec3(0.1, 2.1, -2.0);
  mirrors[0].width = 5.0;
  mirrors[0].height = 5.0;
  mirrors[0].up = vec3(0.0, 0.8, 0.6);
  mirrors[0].right = RIGHT;
  mirrors[0].normal = vec3(0.0, -0.6, 0.8);
  mirrors[0].mat.specularColor = vec3(0.93, 0.93, 1.0);
  mirrors[0].mat.specularRate = 1.0;

  mirrors[1].center = vec3(0.1, 2.1, -2.0) + vec3(0.0, -0.6, 0.8) * 10.0 ;
  mirrors[1].width = 5.0;
  mirrors[1].height = 5.0;
  mirrors[1].up = vec3(0.0, 0.8, 0.6);
  mirrors[1].right = RIGHT;
  mirrors[1].normal = vec3(0.0, -0.6, 0.8);
  mirrors[1].mat.specularColor = vec3(1.0, 1.0, 1.0);
  mirrors[1].mat.specularRate = 1.0;
  
  // spheres
  spheres[0].mat.diffuseColor = vec3(0.7, 0.2, 0.1);
  spheres[0].mat.diffuseRate = 0.1;
  spheres[0].mat.specularColor = spheres[0].mat.diffuseColor; 
  spheres[0].mat.specularRate = 0.05; 
  spheres[0].center = vec3(0.3, 0.2, 0.1); 
  spheres[0].radius = 0.2;
  
  spheres[1].mat.diffuseColor = vec3(0.1, 0.8, 0.1);
  spheres[1].mat.diffuseRate = 0.1;
  spheres[1].mat.specularColor = spheres[1].mat.diffuseColor; 
  spheres[1].mat.specularRate = 0.7; 
  spheres[1].center = vec3(-0.3, 0.8, 0.1);
  spheres[1].radius = 0.3;
  
  spheres[2].mat.diffuseColor = vec3(0.2, 0.2, 0.9);
  spheres[2].mat.diffuseRate = 0.1;
  spheres[2].mat.specularColor = spheres[2].mat.diffuseColor;
  spheres[2].mat.specularRate = 0.2; 
  spheres[2].center = vec3(1.9, 1.0, -0.2);
  spheres[2].radius = 0.4;
  
  float t3 = 1.7;
  spheres[3].mat.diffuseColor = vec3(0.2, 0.9, 0.9);
  spheres[3].mat.diffuseRate = 0.02;
  spheres[3].mat.specularColor = spheres[3].mat.diffuseColor; 
  spheres[3].mat.specularRate = 0.01; 
  spheres[3].mat.transparentColor = vec3(1.0, 1.0, 1.0);
  spheres[3].mat.transmittance = 0.6;

  spheres[3].center = vec3(1.2*cos(time/t3), 1.0*sin(time/t3) + 3.0, 1.2);
  spheres[3].radius = 0.4;
  
  // Boxes
  boxes[0].center = vec3(0.8, 0.4, 0.3);
  boxes[0].size = vec3(0.5, 0.5, 0.5);
  boxes[0].mat.diffuseColor = vec3(0.3 ,0.2, 0.15);
  boxes[0].mat.diffuseRate = 0.1;
  //boxes[0].mat.specularColor = vec3(0.23, 0.13, 0.1);
  //boxes[0].mat.specularRate = 0.9;
  
}

void main( void ) {
  
  Ray ray;
  initScene(ray);
  
  vec3 color = shade(raycast(ray), ray);
  
  gl_FragColor = vec4(color, 1.0);
  vec3 v1;
  if (v1 != BLACK){
    gl_FragColor = vec4(BLACK, 1.0);

  }
}
