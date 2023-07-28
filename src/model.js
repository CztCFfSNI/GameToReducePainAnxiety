async function loadModelInternal(filename) {
    var meshOut = new Mesh();
    var str = fetch(filename).then( r => r.text() );
    var mesh = new OBJ.Mesh(await str);

    var vertCount = mesh.vertices.length;
    meshOut.vert_array = new Float32Array(mesh.vertices);
    meshOut.tex_array = new Float32Array(mesh.textures);
    meshOut.norm_array = new Float32Array(mesh.vertexNormals);
    meshOut.col_array = new Float32Array((vertCount / 3) * 4);
    meshOut.idx_array = new Int16Array(mesh.indices);

    for(var i = 0; i < mesh.vertices.length / 3; i++) {
        meshOut.col_array[i * 4 + 0] = 1;
        meshOut.col_array[i * 4 + 1] = 1;
        meshOut.col_array[i * 4 + 2] = 1;
        meshOut.col_array[i * 4 + 3] = 1;
    }

    meshOut.setup_mesh();
    return meshOut;
}