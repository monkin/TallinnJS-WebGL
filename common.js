
/**
 * Sphere segments count
 */
const SEGMENTS_COUNT = 16;

/**
 * Light source position
 */
const LIGHT_SOURCE = [-2, -4, -5];

/**
 * @param initFn (WebGLContext) => (screenRatio) => void, initializes resources, returns draw function that will be called in the loop
 */
function drawLoop(canvasId, initFn) {
    const canvas = document.getElementById(canvasId),
        context = canvas.getContext("webgl", { antialias: true, depth: false, premultipliedAlpha: false });

    let resizeRequested = true,
        width = 0,
        height = 0;

    function resize() {
        if (resizeRequested) {
            const w = canvas.clientWidth,
                h = canvas.clientHeight,
                px = window.devicePixelRatio || 1; // use real device pixels on high dpi devices
            width = w * px;
            height = h * px;

            canvas.setAttribute("width", width.toFixed(0));
            canvas.setAttribute("height", height.toFixed(0));
            context.viewport(0, 0, width, height);
            resizeRequested = false;
        }
    }
    window.addEventListener("resize", () => resizeRequested = true);

    const draw = initFn(context);
    
    (function nextFrame() {
        requestAnimationFrame(() => {
            resize();
            draw(width / height);
            nextFrame();
        });
    })();
}

function buildShaderProgram(gl, vertexSource, fragmentSource) {
    let vshader = gl.createShader(gl.VERTEX_SHADER),
        fshader = gl.createShader(gl.FRAGMENT_SHADER),
        program = gl.createProgram();

    gl.shaderSource(vshader, vertexSource);
    gl.compileShader(vshader);

    gl.shaderSource(fshader, fragmentSource);
    gl.compileShader(fshader);
    
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);

    if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
        let i = 0;
        throw new Error("Error compiling vertex shader: " + gl.getShaderInfoLog(vshader) + "\n" + vertexSource.replace(/^/mg, () => `${i++}: `));
    }
    if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
        let i = 0;
        throw new Error("Error compiling fragment shader: " + gl.getShaderInfoLog(fshader) + "\n" + fragmentSource.replace(/^/mg, () => `${i++}: `));
    }
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Error linking shaders: " + gl.getProgramInfoLog(program) + "\n" + vertexSource + "\n---\n" + fragmentSource);
    }

    return program;
}