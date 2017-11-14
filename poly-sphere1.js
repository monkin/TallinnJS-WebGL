// Normal per face

const vertexSource1 = `
attribute vec3 a_point;
attribute vec3 a_normal;

varying vec3 v_point;
varying vec3 v_normal;

uniform float u_ratio;

void main() {
    v_point = a_point;
    v_normal = a_normal;
    gl_Position = u_ratio > 1.0
            ? vec4(a_point.x / u_ratio * 0.8, a_point.y * 0.8, 0, 1)
            : vec4(a_point.x * 0.8, a_point.y * u_ratio * 0.8, 0, 1);
}`;

const fragmentSource1 = `
precision highp float;

varying vec3 v_point;
varying vec3 v_normal;

uniform vec3 u_light;

void main() {
    vec3 light = normalize(v_point - u_light);
    vec3 n = normalize(v_normal);

    float ambient = 0.05;
    float diffuse = max(0.0, dot(n, light));
    float specular = 0.8 * pow(max(0.0, dot(normalize(reflect(light, n)), vec3(0, 0, -1))), 15.0);
    vec3 color = vec3(0.1 +  0.4 * (ambient + diffuse) + specular);
    vec3 sRGBColor = pow(color, vec3(1.0 / 2.2));
    gl_FragColor = vec4(sRGBColor, 1);
}`;


function initPolySphere1(gl) {

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
            const b = j / SEGMENTS_COUNT * Math.PI * 2,
                sinB = Math.sin(b),
                cosB = Math.cos(b);
            vertexes.push([
                cosB * sinA,   // x
                cosA,          // y
                - sinB * sinA  // z
            ]);
            console.log("!!!", sinB.toFixed(4), sinA.toFixed(4))
        }
    }

    const triangles = [];
    for (let i = 0; i <= SEGMENTS_COUNT; i++) {
        for (let j = 0; j <= SEGMENTS_COUNT; j++) {
            const cI = i % SEGMENTS_COUNT,
                cJ = j % SEGMENTS_COUNT,
                nI = (i + 1) % SEGMENTS_COUNT,
                nJ = (j + 1) % SEGMENTS_COUNT,
                p1 = vertexes[cJ * SEGMENTS_COUNT + cI],
                p2 = vertexes[nJ * SEGMENTS_COUNT + cI],
                p3 = vertexes[cJ * SEGMENTS_COUNT + nI],
                p4 = vertexes[nJ * SEGMENTS_COUNT + nI],
                normal = p1.map((v, i) => (v + p2[i] + p3[i] + p4[i]) / 4);
            triangles.push(
                // first triangle
                ...p1, ...normal,
                ...p2, ...normal,
                ...p3, ...normal,
                // second triangle
                ...p2, ...normal,
                ...p4, ...normal,
                ...p3, ...normal
            );
        }
    }

    // Buffer with vertexes and normales
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Write data to buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);

    // Prepare program and parameters
    const program = buildShaderProgram(gl, vertexSource1, fragmentSource1),
        ratioLocation = gl.getUniformLocation(program, "u_ratio"),
        lightLocation = gl.getUniformLocation(program, "u_light"),
        pointLocation = gl.getAttribLocation(program, "a_point"),
        normalLocation = gl.getAttribLocation(program, "a_normal");

    gl.useProgram(program);
    gl.uniform3f(lightLocation, ...LIGHT_SOURCE);

    gl.enableVertexAttribArray(pointLocation);
    gl.vertexAttribPointer(pointLocation, 3, gl.FLOAT, false, 6 * 4, 0);

    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

    // Draw loop
    return function drawFrame(ratio) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(ratioLocation, ratio);
        gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 6);
    }
}
