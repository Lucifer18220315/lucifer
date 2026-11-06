module.exports=function(source){
 const value=this.getOptions().value;
 const pattern=/gl\.transmissionResolutionScale\s*=\s*\.5\s*;/;
 if(!pattern.test(source))throw Error('Benchmark cannot locate transmission scale');
 return source.replace(pattern,`gl.transmissionResolutionScale=${value};`);
};
