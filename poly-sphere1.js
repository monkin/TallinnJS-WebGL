// Normal per face

const SEGMENTS_COUNT = 128;

const lightSource = "vec3(-2, -4, -5)";

const vertexSource = `
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

const fragmentSource = `
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
    vec3 color = 0.1 +  0.4 * (ambient + diffuse) + specular;
    vec3 sRGBColor = pow(color, vec3(1.0 / 2.2));
    gl_FragColor = vec4(sRGBColor, 1);
}`;


function initPolySphere1(gl) {

    // Setup WebGL context parameters
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);

    // Generating geometry
    const vertexes = [];
    for (let i = 0; i < SEGMENTS_COUNT; i++) {
        const a = i / SEGMENTS_COUNT * Math.PI,
            sinA = Math.sin(a),
            cosA = Math.cos(z);
        for (let j = 0; j < SEGMENTS_COUNT; j++) {
            const b = i / SEGMENTS_COUNT * Math.PI * 2,
                sinB = Math.sin(b),
                cosB = Math.cos(b);
            points.push([
                cosB * sinA, // x
                cosA,        // y
                sinB * sinA  // z
            ]);
        }
    }

    const vertexesAndNormales = [];
    for (let i = 0; i <= SEGMENTS_COUNT; i++) {
        for (let j = 0; j <= SEGMENTS_COUNT; j++) {
            const nextI = (i + 1) % SEGMENTS_COUNT,
                nextJ = (j + 1) % SEGMENTS_COUNT,
                p1 = vertexes[i * SEGMENTS_COUNT + j],
                p2 = vertexes[nextI * SEGMENTS_COUNT + j],
                p3 = vertexes[i * SEGMENTS_COUNT + nextJ],
                p4 = vertexes[nextI * SEGMENTS_COUNT + nextJ],
                v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]],
                v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]],
                normal = [
                    v1[1] * v2[2] - v1[2] * v2[1],
                    v1[2] * v2[0] - v1[0] * v2[2],
                    v1[0] * v2[1] - v1[1] * v2[0]
                ];
            vertexesAndNormales.push(
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
    gl.bindBuffer(gl.ARRAY_BUFFER, points);
    // Write data to buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexesAndNormales), gl.STATIC_DRAW);

    // Prepare program and parameters
    const program = compile(vertexSource, fragmentSource),
        ratioLocation = gl.getUniformLocation(ballProgram, "u_ratio"),
        lightLocation = gl.getUniformLocation(ballProgram, "u_light"),
        u_light


    return function drawFrame(ratio) {
        gl.clear();
    }
}



const gl = canvas.getContext("webgl", { antialias: false, depth: false, premultipliedAlpha: false }),
    points = gl.createBuffer();

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

gl.bindBuffer(gl.ARRAY_BUFFER, points);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

function createStage() {
    const start = Date.now(),
        STAGE_DURATION = 10000;
    let now = start;
    return {
        next() {
            if (now - start > STAGE_DURATION) {
                return Promise.resolve(false);
            } else {
                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        now = Date.now();
                        resolve(true);
                    });
                });
            }
        },
        time() {
            return Math.min(1, (now - start) / STAGE_DURATION);
        }
    };
}




setTimeout(async function() {
    let ballProgram = compile(ballVertexSource, ballFragmentSource),
        bgProgram = compile(bgVertexSource, bgFragmentSource),
        ballRatioLocation = gl.getUniformLocation(ballProgram, "u_ratio"),
        ballPixelSizeLocation = gl.getUniformLocation(ballProgram, "u_pixelSize"),
        ballTimeLocation = gl.getUniformLocation(ballProgram, "u_time"),
        seedLocation = gl.getUniformLocation(ballProgram, `u_seed`),
        bgRatioLocation = gl.getUniformLocation(bgProgram, "u_ratio"),
        start = Date.now(),
        seed1 = randomSeed(),
        seed2 = randomSeed();

    while (true) {
        const stage = createStage();

        seed1 = seed2;
        seed2 = randomSeed();

        while (await stage.next()) {
            resize();
            const time = Date.now() - start;

            gl.useProgram(bgProgram);
            gl.uniform1f(bgRatioLocation, ratio);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.useProgram(ballProgram);
            gl.uniform1f(ballRatioLocation, ratio);
            gl.uniform1f(ballPixelSizeLocation, 1 / (Math.min(width, height) * 0.75));
            gl.uniform1f(ballTimeLocation, time);
            gl.uniform1fv(seedLocation, mix(seed1, seed2, easing(stage.time())));

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }
});


console.log(ballVertexSource);
console.log(ballFragmentSource);