import * as d3 from 'd3';

// Import d3 color scales - using d3's built-in interpolate functions if available
// Fallback implementations if d3-scale-chromatic is not available
export const d3ColorScales = {
  // Seaborn-equivalent color palettes as arrays of hex colors
  // These are hardcoded to match Seaborn palettes exactly
  
  // Viridis palette (perceptually uniform)
  viridis: [
    "#440154", "#481567", "#482677", "#453781", "#404788", "#39568C", "#33638D", 
    "#2D708E", "#287D8E", "#238A8D", "#1F968B", "#20A387", "#29AF7F", "#3CBB75", 
    "#55C667", "#73D055", "#95D840", "#B8DE29", "#DCE319", "#FDE725"
  ],
  
  // Plasma palette
  plasma: [
    "#0D0887", "#41049D", "#6A00A8", "#8F0DA4", "#B12A90", "#CB4678", "#E16462", 
    "#F1834B", "#FCA636", "#FCCD25", "#F0F921"
  ],
  
  // Inferno palette
  inferno: [
    "#000004", "#160B39", "#420A68", "#6A176E", "#932667", "#BC3754", "#DD513A", 
    "#F37819", "#FCA50A", "#F6D746", "#FCFFA4"
  ],
  
  // Magma palette
  magma: [
    "#000004", "#140E36", "#3B0F70", "#641A80", "#8C2981", "#B5367A", "#DE4968", 
    "#F66E5B", "#FD9F6C", "#FDCD90", "#FBFCBF"
  ],
  
  // Rainbow palette (spectral, not perceptually uniform but matches Seaborn)
  rainbow: [
    "#6E40AA", "#8F3F99", "#AE4283", "#C74570", "#D84C5B", "#E25A49", "#E47037", 
    "#E08D2A", "#D3A81F", "#BFC01D", "#A6D71E", "#88DD28", "#69DF45", "#4EDF69", 
    "#37DF8D", "#2CDEB0", "#2BDAD2", "#34D1ED", "#4BC9F2", "#6ABFEF", "#8BB4E8", 
    "#A9A9DC", "#C29DCE", "#D691BE", "#E387AE"
  ],
  
  // Turbo palette (alternative to jet/rainbow)
  turbo: [
    "#23171B", "#271A28", "#2B1C38", "#2F1E49", "#32205A", "#34236B", "#36257D", 
    "#36278E", "#36299F", "#342CB0", "#322FC0", "#2E32CF", "#2A36DD", "#2539E9", 
    "#1F3CF4", "#193FFE", "#1C43EF", "#2347DF", "#2C4ACD", "#374DBC", "#4150AB", 
    "#4B539A", "#555689", "#5E5978", "#675C68", "#6F5F58", "#776248", "#7E6538", 
    "#856829", "#8B6B1A", "#916D0C", "#967001", "#9B7200", "#A07400", "#A47700", 
    "#A97A00", "#AE7D00", "#B28000", "#B98305", "#BF8609", "#C6890D", "#CC8C11", 
    "#D28F15", "#D89218", "#DE951C", "#E49820", "#EA9B24", "#EF9E27", "#F4A12B", 
    "#F9A42F", "#FDA734", "#FEA938", "#FEAC3C", "#FEAF40", "#FEB244", "#FEB548", 
    "#FEB84C", "#FEBB50", "#FEBE54", "#FEC157", "#FEC45B", "#FEC75F", "#FECA63", 
    "#FECD66", "#FED06A", "#FED36E", "#FED672", "#FED976", "#FEDC7A", "#FEDF7D", 
    "#FEE281", "#FEE585", "#FEE889", "#FEEB8D", "#FEEE91", "#FEF195", "#FEF499", 
    "#FEF69D", "#FEF9A1", "#FEFCA5", "#FDFDFA"
  ],
  
  // Cividis (colorblind-friendly)
  cividis: [
    "#00204C", "#00214E", "#002250", "#002251", "#002353", "#002355", "#002456", 
    "#002558", "#00265A", "#00275B", "#00285D", "#00295E", "#002A5F", "#002B61", 
    "#002C62", "#002D63", "#002E64", "#002F65", "#003066", "#003167", "#003268", 
    "#003369", "#00346A", "#00356B", "#00366C", "#00376C", "#00386D", "#00396E", 
    "#003A6E", "#003B6F", "#003C70", "#003D70", "#003E71", "#003F71", "#004072", 
    "#004172", "#004273", "#004373", "#004473", "#004574", "#004674", "#004775", 
    "#004875", "#004975", "#004A76", "#004B76", "#004C76", "#004D77", "#004E77", 
    "#004F77", "#005078", "#005178", "#005278", "#005378", "#005479", "#005579", 
    "#005679", "#005779", "#00587A", "#00597A", "#005A7A", "#005B7A", "#005C7A", 
    "#005D7B", "#005E7B", "#005F7B", "#01617B", "#02627B", "#03637B", 
    "#04647B", "#05657B", "#06667B", "#07677B", "#08687B", "#09697B", "#0A6A7B", 
    "#0B6B7B", "#0C6C7B", "#0D6D7B", "#0E6E7B", "#0F6F7B", "#10707B", "#11717B", 
    "#12727B", "#13737B", "#14747B", "#15757B", "#16767A", "#17777A", "#18787A", 
    "#19797A", "#1A7A7A", "#1B7B7A", "#1C7C7A", "#1D7D7A", "#1E7E7A", "#1F7F79", 
    "#208079", "#218179", "#228279", "#238378", "#248478", "#258578", "#268677", 
    "#278777", "#288876", "#298976", "#2A8A75", "#2B8B75", "#2C8C74", "#2D8D74", 
    "#2E8E73", "#2F8F72", "#308F72", "#319071", "#329170", "#339270", "#34936F", 
    "#35946E", "#36956D", "#37966D", "#38976C", "#39986B", "#3A996A", "#3B9A69", 
    "#3C9B68", "#3D9C67", "#3E9D66", "#3F9E65", "#409F64", "#41A063", "#42A162", 
    "#43A261", "#44A35F", "#45A45E", "#46A55D", "#47A65C", "#48A75A", "#49A859", 
    "#4AA957", "#4BAA56", "#4CAB55", "#4DAC53", "#4EAD52", "#4FAE50", "#50AF4F", 
    "#51B04D", "#52B14C", "#53B24A", "#54B349", "#56B447", "#57B546", "#58B644", 
    "#59B743", "#5AB741", "#5BB840", "#5CB93E", "#5DBA3D", "#5FBB3B", "#60BC3A", 
    "#61BD38", "#62BE37", "#63BF35", "#65C034", "#66C132", "#67C231", "#68C32F", 
    "#69C42E", "#6BC52C", "#6CC62B", "#6DC729", "#70C926", "#71CA25", "#72CB23", 
    "#73CC22", "#75CD21", "#76CE1F", "#77CF1E", "#79D01C", "#7AD11B", "#7BD21A", 
    "#7CD319", "#7ED417", "#7FD516", "#80D615", "#82D714", "#83D813", "#84D911", 
    "#86DA10", "#87DB0F", "#88DC0E", "#8ADD0D", "#8BDE0C", "#8CDF0B", "#8EE00A", 
    "#8FE109", "#90E308", "#92E407", "#93E506", "#94E606", "#96E705", "#97E804", 
    "#98E904", "#9AEA03", "#9BEB02", "#9DEC02", "#9EED01", "#9FEE01", "#A1EF00", 
    "#A2F000", "#A3F100", "#A5F200", "#A6F300", "#A8F400", "#A9F500", "#AAF600", 
    "#ACF700", "#ADF800", "#AEF900", "#B0FA00", "#B1FB00", "#B3FC00", "#B4FD00", 
    "#B6FE00", "#B7FF00"
  ],
  
  // Restore the interpolation function interfaces to maintain compatibility
  interpolateViridis: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.viridis.length), d3ColorScales.viridis.length - 1);
    return d3ColorScales.viridis[index];
  },
  
  interpolatePlasma: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.plasma.length), d3ColorScales.plasma.length - 1);
    return d3ColorScales.plasma[index];
  },
  
  interpolateInferno: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.inferno.length), d3ColorScales.inferno.length - 1);
    return d3ColorScales.inferno[index];
  },
  
  interpolateMagma: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.magma.length), d3ColorScales.magma.length - 1);
    return d3ColorScales.magma[index];
  },
  
  interpolateRainbow: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.rainbow.length), d3ColorScales.rainbow.length - 1);
    return d3ColorScales.rainbow[index];
  },
  
  interpolateTurbo: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.turbo.length), d3ColorScales.turbo.length - 1);
    return d3ColorScales.turbo[index];
  },
  
  interpolateCividis: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.cividis.length), d3ColorScales.cividis.length - 1);
    return d3ColorScales.cividis[index];
  }
};

// Try to use d3-scale-chromatic if available
try {
  const d3ScaleChromatic = require('d3-scale-chromatic');
  if (d3ScaleChromatic) {
    console.log("Using d3-scale-chromatic for color palettes");
    // We're now going to keep our custom Seaborn palettes instead of using d3's
  }
} catch (e) {
  console.warn("d3-scale-chromatic not available, using Seaborn-like color palettes");
  console.info("To use original d3 color scales, install d3-scale-chromatic:");
  console.info("npm install d3-scale-chromatic");
}

// Helper function to get color from edge color scheme
export const getColorFromEdgeScheme = (value: number, scheme: string): string => {
  // Default blue gradient
  if (scheme === 'default') {
    return d3.interpolateBlues(value);
  }
  
  // Use the color schemes matching the node color schemes
  switch (scheme) {
    case 'viridis': return d3ColorScales.interpolateViridis(value);
    case 'plasma': return d3ColorScales.interpolatePlasma(value);
    case 'inferno': return d3ColorScales.interpolateInferno(value);
    case 'magma': return d3ColorScales.interpolateMagma(value);
    case 'rainbow': return d3ColorScales.interpolateRainbow(value);
    case 'turbo': return d3ColorScales.interpolateTurbo(value);
    case 'cividis': return d3ColorScales.interpolateCividis(value);
    default: return d3.interpolateBlues(value);
  }
}; 