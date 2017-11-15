// Bump mapping

// Normal per vertex

const vertexSource3 = `
attribute vec3 a_point;
attribute vec2 a_angles;

varying vec3 v_point;
varying vec3 v_normal;
varying vec2 v_angles;

uniform float u_ratio;

void main() {
    v_point = a_point;
    v_normal = a_point;
    v_angles = a_angles;
    gl_Position = u_ratio > 1.0
            ? vec4(a_point.x / u_ratio * 0.8, a_point.y * 0.8, 0, 1)
            : vec4(a_point.x * 0.8, a_point.y * u_ratio * 0.8, 0, 1);
}`;

const fragmentSource3 = `
precision highp float;

varying vec3 v_point;
varying vec3 v_normal;
varying vec2 v_angles;

uniform vec3 u_light;

vec3 get_normal_offset(vec3 point, vec2 angles) {
    vec2 a = floor(angles * 4.5 + 0.5) / 4.5;
    float sinA = sin(a.x);
    float cosA = cos(a.x);
    float sinB = sin(a.y);
    float cosB = cos(a.y);
    vec3 target = vec3(cosB * sinA, cosA, - sinB * sinA);
    vec3 d = point - target;
    float l = length(d);
    if (l < 0.01) {
        return vec3(0);
    } else {
        return d / pow(l, 0.5) * 4.0 * smoothstep(0.11, 0.0, l);
    }
}

void main() {
    vec3 light = normalize(v_point - u_light);
    vec3 n = normalize(normalize(v_normal) + get_normal_offset(v_point, v_angles));

    float ambient = 0.05;
    float diffuse = max(0.0, dot(n, light));
    float specular = 0.8 * pow(max(0.0, dot(normalize(reflect(light, n)), vec3(0, 0, -1))), 15.0);
    vec3 color = vec3(0.1 +  0.4 * (ambient + diffuse) + specular);
    vec3 sRGBColor = pow(color, vec3(1.0 / 2.2));
    gl_FragColor = vec4(sRGBColor, 1);
}`;


function initPolySphere3(gl) {

    // Setup WebGL context parameters
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);

    // Generating sphere geometry
    const vertexes = [];
    for (let i = 0; i < SEGMENTS_COUNT; i++) {
        const a = i / (SEGMENTS_COUNT - 1) * Math.PI,
            sinA = Math.sin(a),
            cosA = Math.cos(a);
        for (let j = 0; j < SEGMENTS_COUNT; j++) {
            const b = j / (SEGMENTS_COUNT - 1) * Math.PI * 2,
                sinB = Math.sin(b),
                cosB = Math.cos(b);
            vertexes.push([
                cosB * sinA,   // x
                cosA,          // y
                - sinB * sinA, // z
                a, // fist angle
                b  // second angle
            ]);
        }
    }

    const triangles = [];
    for (let i = 0; i < SEGMENTS_COUNT; i++) {
        for (let j = 0; j < SEGMENTS_COUNT; j++) {
            const cI = i % SEGMENTS_COUNT,
                cJ = j % SEGMENTS_COUNT,
                nI = (i + 1) % SEGMENTS_COUNT,
                nJ = (j + 1) % SEGMENTS_COUNT,
                p1 = vertexes[cJ * SEGMENTS_COUNT + cI],
                p2 = vertexes[nJ * SEGMENTS_COUNT + cI],
                p3 = vertexes[cJ * SEGMENTS_COUNT + nI],
                p4 = vertexes[nJ * SEGMENTS_COUNT + nI];
            triangles.push(
                ...p1, ...p2, ...p3,
                ...p2, ...p4, ...p3
            );
        }
    }

    // Buffer with vertexes and normales
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Write data to buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);

    // Prepare program and parameters
    const program = buildShaderProgram(gl, vertexSource3, fragmentSource3),
        ratioLocation = gl.getUniformLocation(program, "u_ratio"),
        lightLocation = gl.getUniformLocation(program, "u_light"),
        pointLocation = gl.getAttribLocation(program, "a_point"),
        anglesLocation = gl.getAttribLocation(program, "a_angles");

    gl.useProgram(program);
    gl.uniform3f(lightLocation, ...LIGHT_SOURCE);

    gl.enableVertexAttribArray(pointLocation);
    gl.vertexAttribPointer(pointLocation, 3, gl.FLOAT, false, 5 * 4, 0);
    gl.enableVertexAttribArray(anglesLocation);
    gl.vertexAttribPointer(anglesLocation, 2, gl.FLOAT, false, 5 * 4, 3 * 4);

    // Draw loop
    return function drawFrame(ratio) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(ratioLocation, ratio);
        gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 5);
    }
}
