var _base_vs = `#version 300 es
layout (location = 0) in vec3 a_pos;
layout (location = 1) in vec4 a_col;
layout (location = 2) in vec3 a_norm;
layout (location = 3) in vec2 a_tex;

out vec2 v_TexCoord;

void main() {
    gl_Position = vec4(a_pos, 1);
    v_TexCoord = a_tex;
}
`;

var _basic_fs = `#version 300 es
precision highp float;

uniform sampler2D tex0;

out vec4 fragColor;

in vec2 v_TexCoord;

`;

var _base_fs = `#version 300 es
precision highp float;

uniform sampler2D tex0;

out vec4 fragColor;

in vec2 v_TexCoord;

const float gamma = 2.2f;

vec3 Uncharted2ToneMapping(vec3 color)
{
	float A = 0.15;
	float B = 0.50;
	float C = 0.10;
	float D = 0.20;
	float E = 0.02;
	float F = 0.30;
	float W = 11.2;
	float exposure = 2.;
	color *= exposure;
	color = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
	float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
	color /= white;
	color = pow(color, vec3(1. / gamma));
	return color;
}

mat4 brightnessMatrix( float brightness )
{
    return mat4( 1, 0, 0, 0,
                 0, 1, 0, 0,
                 0, 0, 1, 0,
                 brightness, brightness, brightness, 1 );
}

mat4 contrastMatrix( float contrast )
{
	float t = ( 1.0 - contrast ) / 2.0;

    return mat4( contrast, 0, 0, 0,
                 0, contrast, 0, 0,
                 0, 0, contrast, 0,
                 t, t, t, 1 );

}

mat4 saturationMatrix( float saturation )
{
    vec3 luminance = vec3( 0.3086, 0.6094, 0.0820 );

    float oneMinusSat = 1.0 - saturation;

    vec3 red = vec3( luminance.x * oneMinusSat );
    red+= vec3( saturation, 0, 0 );

    vec3 green = vec3( luminance.y * oneMinusSat );
    green += vec3( 0, saturation, 0 );

    vec3 blue = vec3( luminance.z * oneMinusSat );
    blue += vec3( 0, 0, saturation );

    return mat4( red,     0,
                 green,   0,
                 blue,    0,
                 0, 0, 0, 1 );
}

void main() {
    fragColor = brightnessMatrix(0.175f) * contrastMatrix(1.25f) * saturationMatrix(1.5f) * vec4(Uncharted2ToneMapping(texture(tex0, v_TexCoord).rgb), 1.0f);
}
`;

var _fxaa_vs = `#version 300 es
layout (location = 0) in vec3 a_pos;
layout (location = 1) in vec4 a_col;
layout (location = 2) in vec3 a_norm;
layout (location = 3) in vec2 a_tex;

out vec2 v_TexCoord;

out vec2 v_rgbNW;
out vec2 v_rgbNE;
out vec2 v_rgbSW;
out vec2 v_rgbSE;
out vec2 v_rgbM;

uniform vec2 iRes;

void texcoords(vec2 fragCoord, vec2 resolution,
	out vec2 v_rgbNW, out vec2 v_rgbNE,
	out vec2 v_rgbSW, out vec2 v_rgbSE,
	out vec2 v_rgbM) {
	vec2 inverseVP = 1.0 / resolution.xy;
	v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
	v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
	v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
	v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
	v_rgbM = vec2(fragCoord * inverseVP);
}

void main() {
    gl_Position = vec4(a_pos, 1);
    v_TexCoord = a_tex;

	vec2 fragCoord = v_TexCoord * iRes;
	texcoords(fragCoord, iRes, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
`

var _fxaa_fs = `#version 300 es
precision highp float;

in vec2 v_rgbNW;
in vec2 v_rgbNE;
in vec2 v_rgbSW;
in vec2 v_rgbSE;
in vec2 v_rgbM;

in vec2 v_TexCoord;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform vec2 iRes;


#ifndef FXAA_REDUCE_MIN
    #define FXAA_REDUCE_MIN   (1.0/ 128.0)
#endif
#ifndef FXAA_REDUCE_MUL
    #define FXAA_REDUCE_MUL   (1.0 / 8.0)
#endif
#ifndef FXAA_SPAN_MAX
    #define FXAA_SPAN_MAX     8.0
#endif

//optimized version for mobile, where dependent 
//texture reads can be a bottleneck
vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution,
            vec2 v_rgbNW, vec2 v_rgbNE, 
            vec2 v_rgbSW, vec2 v_rgbSE, 
            vec2 v_rgbM) {
    vec4 color;
    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);
    vec3 rgbNW = texture(tex, v_rgbNW).xyz;
    vec3 rgbNE = texture(tex, v_rgbNE).xyz;
    vec3 rgbSW = texture(tex, v_rgbSW).xyz;
    vec3 rgbSE = texture(tex, v_rgbSE).xyz;
    vec4 texColor = texture(tex, v_rgbM);
    vec3 rgbM  = texColor.xyz;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    
    mediump vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
              dir * rcpDirMin)) * inverseVP;
    
    vec3 rgbA = 0.5 * (
        texture(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
        texture(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(tex, fragCoord * inverseVP + dir * -0.5).xyz +
        texture(tex, fragCoord * inverseVP + dir * 0.5).xyz);

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
        color = vec4(rgbA, texColor.a);
    else
        color = vec4(rgbB, texColor.a);
    return color;
}


layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 fragDepth;

void main() {
    vec2 fragCoord = v_TexCoord * iRes; 
	fragColor = fxaa(tex0, fragCoord, iRes, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
	fragDepth = texture(tex1, v_TexCoord);
}

`;

var _edge_fs = `#version 300 es
precision highp float;

#define WO_0 (5.0/16.0)
#define WO_1 (5.0/16.0)

in vec2 v_TexCoord;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform vec2 iRes;


float getDepth(vec2 uv) {
    return texture(tex1, uv).r;
}

float isInInterval(float a, float b, float x) {
    return step(a, x) * (1.0 - step(b, x));
}

void outlineCheck(in vec2 uv, in float weight, in float aBase, inout float n) {
    vec4 data = texture(tex0, uv, 0.0);
    float depth = getDepth(uv);

    n += weight * (1.0 - isInInterval(aBase-0.004, aBase+0.004, depth));
}

float outline(in vec2 uv, in float aBase) {
    vec2 uvPixel = 1.0/iRes.xy;
    float n = 0.0;

    outlineCheck(uv + vec2( 1.0, 0.0)*uvPixel, WO_1, aBase, n);
    outlineCheck(uv + vec2( 0.0, 1.0)*uvPixel, WO_1, aBase, n);
    outlineCheck(uv + vec2( 0.0,-1.0)*uvPixel, WO_1, aBase, n);
    outlineCheck(uv + vec2(-1.0, 0.0)*uvPixel, WO_1, aBase, n);

    outlineCheck(uv + vec2( 1.0, 1.0)*uvPixel, WO_0, aBase, n);
    outlineCheck(uv + vec2( 1.0,-1.0)*uvPixel, WO_0, aBase, n);
    outlineCheck(uv + vec2(-1.0, 1.0)*uvPixel, WO_0, aBase, n);
    outlineCheck(uv + vec2(-1.0,-1.0)*uvPixel, WO_0, aBase, n);

    return n;
}

layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 fragDepth;

void main()
{
    fragColor = texture(tex0, v_TexCoord);

    float depth = getDepth(v_TexCoord);
    float outlineAmount = outline(v_TexCoord, depth);
    vec3 outlineColor = vec3(0.0);
    vec3 finalColor = mix(fragColor.rgb, outlineColor, outlineAmount);

    fragColor = vec4(finalColor, 1.0);
	fragDepth = texture(tex1, v_TexCoord);
}
`;

var _bloom_fs = `#version 300 es
precision highp float;

uniform sampler2D tex0;

out vec4 fragColor;

in vec2 v_TexCoord;

uniform vec2 iRes;

float normpdf(in float x, in float sigma) {
	return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
}

void main() {
    vec4 testColor = texture(tex0, v_TexCoord);
    
    float luma = testColor.r * 0.2125 + testColor.g * 0.7154 + testColor.b * 0.0721;

    if(luma > 0.7) {
        fragColor = testColor;
    } else {
        fragColor = vec4(0, 0, 0, 1);
    }

    const int mSize = 11;
		const int kSize = (mSize-1)/2;
		float kernel[mSize];
		vec3 final_colour = vec3(0.0);
		
		//create the 1-D kernel
		float sigma = 7.0;
		float Z = 0.0;
		for (int j = 0; j <= kSize; ++j)
		{
			kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
		}
		
		//get the normalization factor (as the gaussian has been clamped)
		for (int j = 0; j < mSize; ++j)
		{
			Z += kernel[j];
		}
		
		//read out the texels
		for (int i=-kSize; i <= kSize; ++i)
		{
			for (int j=-kSize; j <= kSize; ++j)
			{
                vec2 variant = vec2(float(i), float(j));
                variant /= iRes * 1.0f;
				final_colour += kernel[kSize+j]*kernel[kSize+i]*texture(tex0, v_TexCoord + variant).rgb;
			}
		}
		
		vec3 bonus = final_colour.rgb / (Z*Z);
        fragColor.rgb += bonus * 0.25;

        fragColor.rgb += testColor.rgb;
}
`;

/**
 * Basic Vertex Shader -- incomplete
 */
 var vs = `#version 300 es
 layout (location = 0) in vec3 a_pos;
 layout (location = 1) in vec4 a_col;
 layout (location = 2) in vec3 a_norm;
 layout (location = 3) in vec2 a_tex;
 
 uniform mat4 m_proj;
 uniform mat4 m_view;
 uniform mat4 m_model;
 
 out vec4 v_color;
 out vec3 v_norm;
 out vec2 v_texCoord;
 
 void main() {
     gl_Position = m_proj * m_view * m_model * vec4(a_pos, 1);
 
     v_color = a_col;
     v_norm = a_norm;
     v_texCoord = a_tex;
 }
 `;
 
 /**
  * Basic Fragment Shader -- incomplete
  */
 var fs = `#version 300 es
 precision highp float;
 
 uniform sampler2D tex0;
 
 in vec4 v_color;
 in vec3 v_norm;
 in vec2 v_texCoord;
 
 out vec4 fragColor;
 
 uniform int noTex;
 
 void main() {
     vec4 outColor = texture(tex0, v_texCoord);
 
     if(noTex == 1) {
         outColor = v_color;
     } else {
         outColor *= v_color;
     }
 
     fragColor = outColor;

	 if(fragColor.a < 0.9f)
	 	discard;
 }
 `;

 var _phong_vs = `#version 300 es

 layout (location = 0) in vec3 aPos;
 layout (location = 1) in vec4 aCol;
 layout (location = 2) in vec3 aNorm;
 layout (location = 3) in vec2 aTex;
 
 out vec4 vColor;
 out vec2 vTex;
 out vec3 vNorm;
 out vec3 fragPos;
 
 uniform mat4 m_proj;
 uniform mat4 m_view;
 uniform mat4 m_model;
 
 void main() {
	 gl_Position = m_proj * m_view * m_model * vec4(aPos, 1.0);
 
	 vColor = aCol;
	 vTex = aTex;
	 vNorm = mat3(transpose(inverse(m_model))) * aNorm;
	 fragPos = vec3(m_model * vec4(aPos, 1.0));
 }
 `;
 
 var _phong_fs = `#version 300 es
 precision highp float;
 
 in vec4 vColor;
 in vec2 vTex;
 in vec3 vNorm;
 
 uniform sampler2D tex0;
 uniform int noTex;
 
 struct Light {
	int type;
	vec3 position;
	vec3 direction;
	vec3 color;
	float intensity;
	float distance;
 };
 
 struct Material {
	 float ambientStrength;
	 float diffuseStrength;
	 float specularStrength;
	 float shininess;
	 vec3 color;
 };
 
 uniform Light light[32];
 uniform int lightCount;
 uniform Material material;
 uniform vec3 ambientColor;
 
 in vec3 fragPos;
 uniform vec3 viewPos;
 
 out vec4 fragColor;

 vec3 calcDirectional(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(-l1.direction);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	vec3 viewDir = normalize(viewPos - fragPos);
	vec3 reflectDir = reflect(-lightDir, norm);

	float spec = pow(max(dot(viewDir, reflectDir), 0.0), pow(2.0f, material.shininess));
	vec3 specularComponent = material.specularStrength * spec * l1.color * l1.intensity;  

	return (diffuseComponent + specularComponent);
 }

 vec3 calcPoint(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(l1.position - fragPos);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	vec3 viewDir = normalize(viewPos - fragPos);
	vec3 reflectDir = reflect(-lightDir, norm);

	float spec = pow(max(dot(viewDir, reflectDir), 0.0), pow(2.0f, material.shininess));
	vec3 specularComponent = material.specularStrength * spec * l1.color * l1.intensity;  

	float distance = length(l1.position - fragPos);
	float attenuation = smoothstep(l1.distance, 0.0f, distance);

	return (diffuseComponent + specularComponent) * attenuation;
 }

 vec3 calcLight(Light l1) { 
	if(l1.type == 0) {
		return calcDirectional(l1);
	} else {
		return calcPoint(l1);
	}
 }
 
 void main() {
 
	 vec4 outColor = texture(tex0, vTex);
 
	 if(noTex == 1)
		 outColor = vColor;
	 else 
		 outColor *= vColor;
 
	if(lightCount > 0) {
	vec3 sum = vec3(0.0f);
	for(int i = 0; i < lightCount; i++) {
		sum += calcLight(light[i]);
	} 
	sum += ambientColor * material.ambientStrength;
	outColor.rgb *= sum;
	}
	outColor.rgb *= material.color;
 
	fragColor = vec4(outColor.rgb, 1.0);
 }
 `;

 var _lambert_vs = `#version 300 es

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec4 aCol;
layout (location = 2) in vec3 aNorm;
layout (location = 3) in vec2 aTex;

out vec4 vColor;
out vec2 vTex;
out vec3 vNorm;
out vec3 fragPos;

uniform mat4 m_proj;
uniform mat4 m_view;
uniform mat4 m_model;

void main() {
	gl_Position = m_proj * m_view * m_model * vec4(aPos, 1.0);

	vColor = aCol;
	vTex = aTex;
	vNorm = mat3(transpose(inverse(m_model))) * aNorm;
	fragPos = vec3(m_model * vec4(aPos, 1.0));
}
`;

var _lambert_fs = `#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vTex;
in vec3 vNorm;

uniform sampler2D tex0;
uniform int noTex;

struct Light {
	int type;
	vec3 position;
	vec3 direction;
	vec3 color;
	float intensity;
	float distance;
};

struct Material {
	float ambientStrength;
	float diffuseStrength;
	vec3 color;
};

uniform Light light[32];
uniform int lightCount;
uniform Material material;
uniform vec3 ambientColor;

in vec3 fragPos;
uniform vec3 viewPos;

out vec4 fragColor;

vec3 calcDirectional(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(-l1.direction);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	return (diffuseComponent);
 }

 vec3 calcPoint(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(l1.position - fragPos);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	float distance = length(l1.position - fragPos);
	float attenuation = smoothstep(l1.distance, 0.0f, distance);

	return (diffuseComponent) * attenuation;
 }

 vec3 calcLight(Light l1) { 
	if(l1.type == 0) {
		return calcDirectional(l1);
	} else {
		return calcPoint(l1);
	}
 }

void main() {

	vec4 outColor = texture(tex0, vTex);

	if(noTex == 1)
		outColor = vColor;
	else 
		outColor *= vColor;

   if(lightCount > 0) {
   vec3 sum = vec3(0.0f);
   for(int i = 0; i < lightCount; i++) {
	   sum += calcLight(light[i]);
   } 
	sum += ambientColor * material.ambientStrength;
   outColor.rgb *= sum;
   }
   outColor.rgb *= material.color;

   fragColor = vec4(outColor.rgb, 1.0);
}
`;

var _phong_toon_vs = `#version 300 es

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec4 aCol;
layout (location = 2) in vec3 aNorm;
layout (location = 3) in vec2 aTex;

out vec4 vColor;
out vec2 vTex;
out vec3 vNorm;
out vec3 fragPos;

uniform mat4 m_proj;
uniform mat4 m_view;
uniform mat4 m_model;

void main() {
	gl_Position = m_proj * m_view * m_model * vec4(aPos, 1.0);

	vColor = aCol;
	vTex = aTex;
	vNorm = mat3(transpose(inverse(m_model))) * aNorm;
	fragPos = vec3(m_model * vec4(aPos, 1.0));
}
`;

var _phong_toon_fs = `#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vTex;
in vec3 vNorm;

uniform sampler2D tex0;
uniform int noTex;

struct Light {
	int type;
	vec3 position;
	vec3 direction;
	vec3 color;
	float intensity;
	float distance;
};

struct Material {
	float ambientStrength;
	float diffuseStrength;
	float specularStrength;
	float shininess;
	vec3 color;
};

uniform Light light[32];
uniform int lightCount;
uniform Material material;
uniform vec3 ambientColor;

in vec3 fragPos;
uniform vec3 viewPos;

out vec4 fragColor;

vec3 calcDirectional(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(-l1.direction);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	vec3 viewDir = normalize(viewPos - fragPos);
	vec3 reflectDir = reflect(-lightDir, norm);

	float spec = pow(max(dot(viewDir, reflectDir), 0.0), pow(2.0f, material.shininess));
	vec3 specularComponent = material.specularStrength * spec * l1.color * l1.intensity;  

	float intensity = diff * 0.6f + spec * 0.4f;

	if (intensity > 0.9) {
		 intensity = 1.1;
	 }
	 else if (intensity > 0.5) {
		 intensity = 0.7;
	 }
	 else {
		 intensity = 0.5;
	}
 
	return (diffuseComponent + specularComponent) * intensity * 1.5f;
 }

 vec3 calcPoint(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(l1.position - fragPos);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	vec3 viewDir = normalize(viewPos - fragPos);
	vec3 reflectDir = reflect(-lightDir, norm);

	float spec = pow(max(dot(viewDir, reflectDir), 0.0), pow(2.0f, material.shininess));
	vec3 specularComponent = material.specularStrength * spec * l1.color * l1.intensity;  

	float distance = length(l1.position - fragPos);
	float attenuation = smoothstep(l1.distance, 0.0f, distance);

	float intensity = diff * 0.6f + spec * 0.4f;

	if (intensity > 0.9) {
		 intensity = 1.1;
	 }
	 else if (intensity > 0.5) {
		 intensity = 0.7;
	 }
	 else {
		 intensity = 0.5;
	}

	return (diffuseComponent + specularComponent) * attenuation * intensity * 1.5f;
 }

 vec3 calcLight(Light l1) { 
	if(l1.type == 0) {
		return calcDirectional(l1);
	} else {
		return calcPoint(l1);
	}
 }

void main() {

	vec4 outColor = texture(tex0, vTex);

	if(noTex == 1)
		outColor = vColor;
	else 
		outColor *= vColor;

   if(lightCount > 0) {
   vec3 sum = vec3(0.0f);
   for(int i = 0; i < lightCount; i++) {
	   sum += calcLight(light[i]);
   } 
	sum += ambientColor * material.ambientStrength;
   outColor.rgb *= sum;
   }
   outColor.rgb *= material.color;

   fragColor = outColor;

   if(fragColor.a < 0.1) 
   	discard;
}
`;

var _lambert_toon_vs = `#version 300 es

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec4 aCol;
layout (location = 2) in vec3 aNorm;
layout (location = 3) in vec2 aTex;

out vec4 vColor;
out vec2 vTex;
out vec3 vNorm;
out vec3 fragPos;

uniform mat4 m_proj;
uniform mat4 m_view;
uniform mat4 m_model;

void main() {
   gl_Position = m_proj * m_view * m_model * vec4(aPos, 1.0);

   vColor = aCol;
   vTex = aTex;
   vNorm = mat3(transpose(inverse(m_model))) * aNorm;
   fragPos = vec3(m_model * vec4(aPos, 1.0));
}
`;

var _lambert_toon_fs = `#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vTex;
in vec3 vNorm;

uniform sampler2D tex0;
uniform int noTex;

struct Light {
	int type;
	vec3 position;
	vec3 direction;
	vec3 color;
	float intensity;
	float distance;
};

struct Material {
	float ambientStrength;
	float diffuseStrength;
	vec3 color;
};

uniform Light light[32];
uniform int lightCount;
uniform Material material;
uniform vec3 ambientColor;

in vec3 fragPos;
uniform vec3 viewPos;

out vec4 fragColor;

vec3 calcDirectional(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(-l1.direction);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	float intensity = diff;

	if (intensity > 0.9) {
		 intensity = 1.1;
	 }
	 else if (intensity > 0.5) {
		 intensity = 0.7;
	 }
	 else {
		 intensity = 0.5;
	}
 
	return (diffuseComponent) * intensity * 1.5f;
 }

 vec3 calcPoint(Light l1) {
	vec3 norm = normalize(vNorm);
	vec3 lightDir = normalize(l1.position - fragPos);
	float diff = max(dot(norm, lightDir), 0.0f) * material.diffuseStrength * l1.intensity;
	vec3 diffuseComponent = diff * l1.color;

	float distance = length(l1.position - fragPos);
	float attenuation = smoothstep(l1.distance, 0.0f, distance);

	float intensity = diff;

	if (intensity > 0.9) {
		 intensity = 1.1;
	 }
	 else if (intensity > 0.5) {
		 intensity = 0.7;
	 }
	 else {
		 intensity = 0.5;
	}

	return (diffuseComponent) * attenuation * intensity * 1.5f;
 }

 vec3 calcLight(Light l1) { 
	if(l1.type == 0) {
		return calcDirectional(l1);
	} else {
		return calcPoint(l1);
	}
 }

void main() {

	vec4 outColor = texture(tex0, vTex);

	if(noTex == 1)
		outColor = vColor;
	else 
		outColor *= vColor;

   if(lightCount > 0) {
   vec3 sum = vec3(0.0f);
   for(int i = 0; i < lightCount; i++) {
	   sum += calcLight(light[i]);
   } 
   sum += ambientColor * material.ambientStrength;
   outColor.rgb *= sum;
   }
   outColor.rgb *= material.color;

   fragColor = vec4(outColor.rgb, 1.0);
}
`;
