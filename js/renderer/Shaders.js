export const vertexShaderSource = `#version 300 es
layout(location = 0) in vec2 a_quadPosition;
layout(location = 1) in vec2 a_instPosition;
layout(location = 2) in vec2 a_instScale;
layout(location = 3) in vec4 a_instColor;
layout(location = 4) in float a_instRotation;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
    float c = cos(a_instRotation);
    float s = sin(a_instRotation);
    mat2 rotationMatrix = mat2(c, s, -s, c);
    
    vec2 scaledPosition = a_quadPosition * a_instScale;
    vec2 rotatedPosition = rotationMatrix * scaledPosition;
    vec2 transformedPosition = rotatedPosition + a_instPosition;
    
    vec2 zeroToOne = transformedPosition / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
    v_color = a_instColor;
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;
