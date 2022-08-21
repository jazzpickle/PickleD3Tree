
/* Copyright © 2022 jazzpickle. All rights reserved. */

const ClassList = ["xvg-style-primary", "xvg-style-secondary", "xvg-style-tertiary"];

function getRand(min, max) {
    var rng = max - min;
    return min + (Math.random() * rng);
}

function getRandCategory(list) {
    let n = list.length;
    let i = Math.floor(Math.random() * n);
    return list[i];
}
// > randFac: float between 0 and 1.
// > interControlPosCount: count of controlling points in between start and end.
function getRandLineData(start,end,interControlPosCount,randFac) {

    var cpc = interControlPosCount + 2;
    let rng = { x: (end.x - start.x), y: (end.y - start.y) };
    let len = Math.sqrt((rng.x * rng.x) + (rng.y * rng.y));
    let randMin = (len / 2) * (-1);
    let randMax = (len / 2);
    let x = d3.scaleLinear().domain([0, (cpc-1)]).range([start.x, end.x]);
    let y = d3.scaleLinear().domain([0, (cpc-1)]).range([start.y, end.y]);
    var line = d3.line()
        .x(function (d, i) { return x(i) + d.x; })
        .y(function (d, i) { return y(i) + d.y; })
        .curve(d3.curveNatural)

    var data = d3.range(cpc).map(function (d) {
        //return d == 0 || d == (cpc - 1) ? { x: 0, y: 0 } : { x: Math.random() * (cpc * randFac), y: Math.random() * (cpc * randFac) }
        return d == 0 || d == (cpc - 1) ? { x: 0, y: 0 } : { x: getRand(randMin, randMax) * randFac, y: getRand(randMin, randMax) * randFac }
    });

    return line(data);
}

function updateSvgSeeds(base, data) {
    base = base.selectAll("circle")
        .data(data);

    base.enter()
        .append("circle")
        .attr("r", function (d) { return d.size; })
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("class", function (d) { return d.class; });

    base.select("circle")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("class", function (d) { return d.class; });

    base.exit()
        .remove();
}



// > variationFactor: 0 to 1
// > biasFactor: -1 to 1
function nextNodeSize(previusSize, min, max, variationFactor, biasFactor) {
    if (variationFactor == 0) {
        return previusSize;
    }
    else if (variationFactor >= 1 && biasFactor == 0) { // (variationFactor == 1 && biasFactor == 0)
        return getRand(min, max);
    }
    else if (variationFactor >= 1 && biasFactor >= 1) { // (variationFactor == 1 && biasFactor == 1)
        return getRand(previusSize, max);
    }
    else if (variationFactor >= 1 && biasFactor <= -1) { // (variationFactor == 1 && biasFactor == -1)
        return getRand(min, previusSize);
    }
    else {
        var dMin = previusSize - min;
        var dMax = max - previusSize;
        var nextMin = previusSize - ((dMin * variationFactor) * (biasFactor > 0 ? 1 - biasFactor : 1) );
        var nextMax = previusSize + ((dMax * variationFactor) * (biasFactor < 0 ? 1 + biasFactor : 1) );
        return getRand(nextMin, nextMax);
    }
}
function nextStyleClass(previusClass, variationFactor) {
    return Math.random() > variationFactor ? previusClass : getRandCategory(ClassList)
}
// > meshFactor: 0 to 1
// > jaggerFactor: 0 to 1
function jiggleNodeData(nodes, tier, options) {
    for (let i = 0; i < nodes.length; ++i) {
        nodes[i].x = nodes[i].x + getRand((options.jiggle.x.value * -1), options.jiggle.x.value);
        nodes[i].y = nodes[i].y + getRand((options.jiggle.y.value * -1), options.jiggle.y.value);
    }
}
function jiggleAllNodeData(data, startTier, options) {
    for (let i = startTier; i < data.length; ++i) {
        jiggleNodeData(data[i].nodes, i, options);
    }
}
function nextNodeData(prevNodes, tier, options) {
    options = options !== undefined && options !== null ? options : {
        variation: 0.3
        , bias: 0
        , baseClass: "xvg-tree-part"
        , branch: {
            path: { points: 2, variation: 0.2 }
            , angle: {
                variation: { factor: 0.3, tierBias: 0.1 }
                , direction: { bias: 0.3 }
            }
            , length: { value: 5, variation: 0.2, bias: -0.2 }
            , width: { factor: 0.5 } /* the width is calculated from the node size (excluding typeFactor's) and this factor */
        }
        , node: {
            joint: {
                tierRange: { start: 5, end: 6 }
                , size: { min: 0.3, max: 2, bias: 0, variation: 0.3, typeFactor: 0.3 }
                , border: { width: { factor: 0.2 } }
                , class: "xvg-joint"
            }
            , leath: {
                tierRange: { start: 5, end: 6 }
                , size: { min: 0.3, max: 2, bias: 0, variation: 0.3, typeFactor: 1 }
                , border: { width: { factor: 0.2 } }
                , class: "xvg-leaf"
            }
        }
        , seed: {
            growth: {
                direction: { value: 0 /*in rads*/, variation: 0 }
                , density: { value: 1, variation: 0 }
            }
            , offset: { x: 0, y: 20 }
        }
        , mesh: { factor: 0.2, variation: 0.5, tierBias: 0.2, jagger: 0.1 }        
        , tierMax: 5
        , density: { value: 3, variation: 0.5, tierBias: 0.1 }
        , boundingBox: [{ x: 0, y: 0 }, { x: 100, y: 100 }] // > [{topLeft},{bottomRight}]
        , jiggle: { x: { value: 3 }, y: { value: 3 } }
    };

    var nodeOptions = tier >= options.node.leaf.tierRange.start && tier <= options.node.leaf.tierRange.end
        ? options.node.leaf
        : options.node.joint;

    var branchAnglePreBaseRange = Math.PI * options.branch.angle.variation.factor;
    var branchAngleBaseRange = branchAnglePreBaseRange + (branchAnglePreBaseRange * (options.branch.angle.variation.tierBias * ((tier + 1) / options.tierMax)));
    var nextNodes = [];
    for (let i = 0; i < prevNodes.length; ++i) {
        // =========== Branch Angle/Length Base [START] =========== //
        var angleMin = 0; var angleMax = 2 * Math.PI;
        var lenVal = options.branch.length.value;
        var pB = { x: prevNodes[i].x, y: prevNodes[i].y };
        var pA = pB;
        if (tier <= 1) {
            if (options.seed.growth.direction.variation != 1) {
                // angle in radians
                angleMin = options.seed.growth.direction.value - ((Math.PI * options.seed.growth.direction.variation) * (options.branch.angle.direction.bias > 0 ? (1 - options.branch.angle.direction.bias) : 1));
                angleMax = options.seed.growth.direction.value + ((Math.PI * options.seed.growth.direction.variation) * (options.branch.angle.direction.bias < 0 ? (1 + options.branch.angle.direction.bias) : 1));
            }
        }
        else if (prevNodes[i].parents != null && prevNodes[i].parents.length > 0) {
            pA = { x: prevNodes[i].parents[0].x, y: prevNodes[i].parents[0].y };
            pB = { x: prevNodes[i].x, y: prevNodes[i].y };
            dAB = { x: (pB.x - pA.x), y: (pB.y - pA.y) };

            // --------------- angle min/max [START] ------------- //
            if (options.branch.angle.variation.factor < 1) {
                // angle in radians
                var prevAngle = Math.atan2(dAB.y, dAB.x);
                angleMin = prevAngle - (branchAngleBaseRange * (options.branch.angle.direction.bias > 0 ? (1 - options.branch.angle.direction.bias) : 1));
                angleMax = prevAngle + (branchAngleBaseRange * (options.branch.angle.direction.bias < 0 ? (1 + options.branch.angle.direction.bias) : 1));
            }
            // --------------- angle min/max [END] ------------- //

            // --------------- length min/max [START] ------------- //
            if (options.branch.length.variation > 0 || options.branch.length.bias != 0) {
                var prevLen = Math.sqrt((dAB.x * dAB.x) + (dAB.y * dAB.y));
                lenVal = prevLen + (options.branch.length.bias * prevLen * (0.5 + options.branch.length.variation));
            }
            // --------------- length min/max [END] ------------- //

        }
        var lenMin = options.branch.length.variation == 0 ? lenVal : lenVal - (lenVal * options.branch.length.variation);
        var lenMax = options.branch.length.variation == 0 ? lenVal : lenVal + (lenVal * options.branch.length.variation);

        // =========== Branch Angle/Length Base [END] =========== //
        var newGroupDensityValue = tier <= 1 ? options.seed.growth.density.value : options.density.value;
        var newGroupDensityVariation = tier <= 1 ? options.seed.growth.density.variation : options.density.variation;
        if (tier > 1 && options.density.tierBias != 0) { newGroupDensityValue = newGroupDensityValue + (newGroupDensityValue * options.density.tierBias * tier) }
        var newGroupCount = newGroupDensityVariation == 0 ? newGroupDensityValue
            : Math.floor(getRand(
                newGroupDensityValue - (newGroupDensityValue * newGroupDensityVariation)
                , newGroupDensityValue + (newGroupDensityValue * newGroupDensityVariation)
            ));
        for (let j = 0; j < newGroupCount; ++j) {
            // =========== Branch Angle/Length -> Node Positioning [START] =========== //
            var angleBC = getRand(angleMin, angleMax);
            var lenBC = getRand(lenMin, lenMax);
            var _dBC = { x: Math.cos(angleBC), y: Math.sin(angleBC) };
            var dBC = { x: _dBC.x * lenBC, y: _dBC.y * lenBC };
            var pC = { x: pB.x + dBC.x, y: pB.y + dBC.y };
            // =========== Branch Angle/Length -> Node Positioning [END] =========== //
            nextNodes.push({
                x: pC.x
                , y: pC.y
                , classStyle: nextStyleClass(prevNodes[i].classStyle, options.variation)
                , classTier: "xvg-tier-" + tier
                , getNodeClass: function () { return options.baseClass + " " + "xvg-node" + " " + nodeOptions.class + " " + this.classStyle + " " + this.classTier; }
                , getLinkClass: function () { return options.baseClass + " " + "xvg-link" + " " + nodeOptions.class + " " + this.classStyle + " " + this.classTier; }
                , size: nextNodeSize(prevNodes[i].size, nodeOptions.size.min, nodeOptions.size.max, nodeOptions.size.variation, nodeOptions.size.bias)
                , getLinkWidth: function () { return this.size * options.branch.width.factor; }
                , getBorderWidth: function () { return this.size * nodeOptions.border.width.factor; }
                , tier: tier
                , parents: []
                , children: []
            });
            var childIdx = nextNodes.length - 1;

            
            nextNodes[childIdx].parents.push(prevNodes[i]);
            prevNodes[i].children.push(nextNodes[childIdx]);
            // --- secondary links [START] --- //
            let secondaryLinkCount = options.mesh.factor == 0 ? 0
                : options.mesh.variation == 0 && options.mesh.tierBias == 0 ? Math.floor(options.density.value * options.mesh.factor)
                    : options.mesh.variation == 0 ? Math.floor((options.density.value * options.mesh.factor) + (options.density.value * options.mesh.factor * (options.mesh.tierBias * tier)))
                        : Math.floor(getRand(
                            (options.density.value * options.mesh.factor) - (options.density.value * options.mesh.factor * options.mesh.variation * (1+(options.mesh.tierBias * tier)))
                            , (options.density.value * options.mesh.factor) + (options.density.value * options.mesh.factor * options.mesh.variation * (1+(options.mesh.tierBias * tier)))
                        ));
            for (let k = 0; k < secondaryLinkCount; ++k) {
                let ki = Math.floor(Math.random() * prevNodes.length);
                if (ki < prevNodes.length) {
                    // > use 'options.mesh.jagger' here to decide if and how far to go back through previous parent tiers to choose secondary parent.
                    if (options.mesh.jagger > 0) {
                        let backSteps = Math.floor(Math.random() * tier * options.mesh.jagger);
                        let node = prevNodes[ki];
                        for (let stp = 0; stp < backSteps; ++stp) {
                            if (node.parents != null && node.parents.length > 0) {
                                node = node.parents[0];
                            }
                        }
                        nextNodes[childIdx].parents.push(node);
                        node.children.push(nextNodes[childIdx]);
                    }
                    else {
                        nextNodes[childIdx].parents.push(prevNodes[ki]);
                        prevNodes[ki].children.push(nextNodes[childIdx]);
                    }
                }
            }
            // --- secondary links [END] --- //       
        }
    }
    return nextNodes;

}
function createNodeLinks(nodes, tier, options) {
    links = [];
    for (let i = 0; i < nodes.length; ++i) {
        target = nodes[i];
        for (let j = 0; j < target.parents.length; ++j) {
            links.push(
                {
                    source: target.parents[j]
                    , target: target
                    , totalLength: 0 // > this is unknown untill the path is calculated/drawn
                    , tier: tier
                }
            )
        }
    }
    return links;
}
function getNodeTierClassSelector(tier) {
    return ".xvg-node.xvg-tier-" + tier;
}
function getLinkTierClassSelector(tier) {
    return ".xvg-link.xvg-tier-" + tier;
}
function isNodeDataValid(d) {
    return d !== undefined && d !== null;
}
function loopGetNextNodeData(base, prevData, data, prevTier, options, onComplete) {
    var prevTierIndex = prevTier;
    var tier = prevTier + 1;
    prevData.push(data);
    if (tier <= options.tierMax) {
        var newNodes = nextNodeData(prevData[prevTierIndex].nodes, tier, options);
        var newLinks = createNodeLinks(newNodes, tier, options);
        data = { nodes: newNodes, links: newLinks };
        loopUpdateSvgLinks(base, prevData, data, tier, options, onComplete);
    }
    else {
        return onComplete(base, prevData, options, onComplete);
    }
}
function loopUpdateSvgLinks(base0, prevData, data, tier, options, onComplete) {
    var paths = base0.selectAll(getLinkTierClassSelector(tier))
        .data(data.links);


    paths.enter()
        .append("path")
        .attr("d", function (d) { return getRandLineData({ x: d.source.x, y: d.source.y }, { x: d.target.x, y: d.target.y }, options.branch.path.points, options.branch.path.variation); })
        .attr("class", function (d) { return d.source.getLinkClass(); })
        .attr("stroke-width", (d) => { return 0; })
        .attr("fill", "none")
        .each(function (d) { d.totalLength = this.getTotalLength(); })
        .attr("stroke-dasharray", (d) => { return d.totalLength + " " + d.totalLength; })
        .attr("stroke-dashoffset", (d) => { return d.totalLength; })
        .transition()
        .duration(2000)
        //.delay(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .attr("stroke-width", (d) => { return d.source.getLinkWidth(); })
        .end()
        .then(() => {
            if ( (tier >= options.node.leaf.tierRange.start && tier <= options.node.leaf.tierRange.end)
                || (tier >= options.node.joint.tierRange.start && tier <= options.node.joint.tierRange.end) ) {
                return loopUpdateSvgNodes(base0, prevData, data, tier, options, onComplete);
            }
            else {
                return loopGetNextNodeData(base0, prevData, data, tier, options, onComplete);
            }
        });

}
function loopUpdateSvgNodes(base0, prevData, data, tier, options, onComplete) {

    var nodeOptions = tier >= options.node.leaf.tierRange.start && tier <= options.node.leaf.tierRange.end
        ? options.node.leaf
        : options.node.joint;

    base = base0.selectAll(getNodeTierClassSelector(tier))
        .data(data.nodes);

    base.enter()
        .append("circle")
        .attr("r", function (d) { return 0; })
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("stroke-width", function (d) { return d.getBorderWidth(); })
        .attr("class", function (d) { return d.getNodeClass(); })
        .transition()
        .duration(600)
        //.delay(2000)
        .attr("r", function (d) { return d.size * nodeOptions.size.typeFactor; })
        .end()
        .then(() => { return loopGetNextNodeData(base0, prevData, data, tier, options, onComplete); });

    base.select("circle")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("class", function (d) { return d.getNodeClass(); });

    base.exit()
        .remove();

}
function onCompleteSvgReset(base0, prevData, options, onComplete) {
    let seedCount = 1;
    let svgViewBox = {
        width: options.boundingBox[1].x - options.boundingBox[0].x
        , height: options.boundingBox[1].y - options.boundingBox[0].y
    };
    let seedData = createSeeds(seedCount, svgViewBox, options);

    let center = {
        x: ((options.boundingBox[0].x + options.boundingBox[1].x) / 2)
        , y: ((options.boundingBox[0].y + options.boundingBox[1].y) / 2)
    };

    let strokeExit = getRandLineData(
        { x: (center.x - (svgViewBox.width * 0.01)), y: (center.y - (svgViewBox.height * 0.01)) }
        , { x: (center.x + (svgViewBox.width * 0.01)), y: (center.y + (svgViewBox.height * 0.01)) }
        , options.branch.path.points, 5/*options.branch.path.variation*/);

    base = base0.selectAll("." + options.baseClass)
        .data([]);

    base.exit()
        .transition()
        .duration(600)
        //.delay(1000)
        .attr("r", 0)
        .attr("stroke-width", 0)
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("d", strokeExit)
        .remove()
        .end()
        .then(() => { return growSeeds(base0, seedData, options, onComplete); });
}
function onCompleteSvgJiggleReset(base0, prevData, options, onComplete) {
    let seedCount = 1;
    let svgViewBox = {
        width: options.boundingBox[1].x - options.boundingBox[0].x
        , height: options.boundingBox[1].y - options.boundingBox[0].y
    };

    jiggleAllNodeData(prevData, 1, options);

    for (let i = 0; i < prevData.length; ++i) {
        var tempNodeBase = base0.selectAll(getNodeTierClassSelector(i))
            .data(prevData[i].nodes);
    }

    linkBase = base0.selectAll("." + options.baseClass + ".xvg-link");
    linkBase = linkBase.attr("stroke-dasharray", "none");


    base = base0.selectAll("." + options.baseClass);

    base.transition()
        .duration(7000)
        .delay(1000)
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("d", function (d) {
            return d.source ?
                getRandLineData({ x: d.source.x, y: d.source.y }, { x: d.target.x, y: d.target.y }, options.branch.path.points, options.branch.path.variation)
                : "";
        })
        .end()
        .then(() => { return onCompleteSvgReset(base0, prevData, options, onComplete); });

}
function updateSvgNodes(base, data, tier) {

    base = base.selectAll(getNodeTierClassSelector(tier))
        .data(data.nodes);

    base.enter()
        .append("circle")
        .attr("r", function (d) { return 0; })
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("class", function (d) { return d.getNodeClass(); })
        .transition()
        .duration(600)
        //.delay()
        .attr("r", function (d) { return d.size; });

    base.select("circle")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("class", function (d) { return d.getNodeClass(); });

    base.exit()
        .remove();
}
function growSeeds(baseGroup, seedData, options, onComplete) {
    updateSvgNodes(baseGroup, seedData, 0);
    if (options.tierMax > 0) {
        var prevData = [];
        loopGetNextNodeData(baseGroup, prevData, seedData, 0, options, onComplete)
    }
    else if (onComplete !== undefined && onComplete !== null) {
        return onComplete(baseGroup, options, onComplete);
    }
}
function createSeeds(count, boundingBox, options) {
    var seedData = { nodes: [], links: [] };
    for (let i = 0; i < count; ++i) {
        seedData.nodes.push({
            x: count == 1 ? (boundingBox.width / 2) + options.seed.offset.x : (boundingBox.width / 2) + getRand(((boundingBox.width / 2) * -0.8), ((boundingBox.width / 2) * 0.8)) + options.seed.offset.x
            , y: count == 1 ? (boundingBox.height / 2) + options.seed.offset.y : (boundingBox.height / 2) + getRand(((boundingBox.height / 2) * -0.8), ((boundingBox.height / 2) * 0.8)) + options.seed.offset.y
            , classStyle: getRandCategory(ClassList)
            , classTier: "xvg-tier-0"
            , getNodeClass: function () { return options.baseClass + " " + "xvg-node" + " " + this.classStyle + " " + this.classTier; }
            , getLinkClass: function () { return options.baseClass + " " + "xvg-link" + " " + this.classStyle + " " + this.classTier; }
            , size: getRand(1, 3)
            , getLinkWidth: function () { return this.size * options.branch.width.factor; }
            , getBorderWidth: function () { return this.size / 2; }
            , tier: 0
            , parents: null
            , children: []
        });
    }
    return seedData;
}

function initTree(anchorId) {

    
    var jsvisBaseSvgHtml = `
    <svg class="xvg-jsvis-svg" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <g class="xvg-jsvis-base-g">
        </g>
    </svg>
    `
    var screen = d3.select("#" + anchorId)
        .append("div").attr("class", "xv-jsvis-card xv-centre-circle").style("border-radius", "50%")
        .append("div").attr("class", "xv-jsvis-container");

    screen.html(jsvisBaseSvgHtml);


    //// ******* {viewbox method} [START] ******* //
    var svgRealBox = document.getElementById(anchorId).getElementsByClassName("xvg-jsvis-svg")[0].getBoundingClientRect();
    var svgAttrBox = { width: d3.select("#" + anchorId).select("." + "xvg-jsvis-svg").style("width").replace(/[^\d.-]/g, ''), height: d3.select("#" + anchorId).select("." + "xvg-jsvis-svg").style("height").replace(/[^\d.-]/g, '') };
    var svgViewBox = { width: 100, height: 100 };
    var boxRatio = { width: (svgRealBox.width / svgViewBox.width), height: (svgRealBox.height / svgViewBox.height) };
    //// ******* {viewbox method} [END] ******* //

    var options = {
        variation: 0.1
        , bias: 0
        , baseClass: "xvg-tree-part"
        , branch: {
            path: { points: 2, variation: 0.2 }
            , angle: {
                variation: { factor: 0.2, tierBias: 0.5 }
                , direction: { bias: 0 }
            }
            , length: { value: 11, variation: 0.2, bias: -0.2 }
            , width: { factor: 0.8 } /* the width is calculated from the node size (excluding typeFactor's) and this factor */
        }
        , node: {
            joint: {
                tierRange: { start: 0, end: 4 }
                , size: { min: 0.01, max: 2, bias: -1, variation: 0.6, typeFactor: 0.3 }
                , border: { width: { factor: 0.5 } }
                , class: "xvg-joint"
            }
            ,
            leaf: {
                tierRange: { start: 5, end: 5 }
                , size: { min: 0.01, max: 2, bias: -1, variation: 0.6, typeFactor: 3.5 }
                , border: { width: { factor: 0.5 } }
                , class: "xvg-leaf"
            }
        }
        , seed: {
            growth: {
                direction: { value: 1.5 * Math.PI /*in rads*/, variation: 0.2 }
                , density: { value: 1, variation: 0 }
            }
            , offset: {x:0,y:15}
        }
        , mesh: { factor: 0.177, variation: 0.9, tierBias: 0, jagger: 0.5 } // mesh: { factor: 0.177, variation: 0.9, tierBias: 0, jagger: 0.5 }
        , tierMax: 5
        , density: { value: 3, variation: 0.2, tierBias: 0.1 }
        , boundingBox: [{ x: 0, y: 0 }, { x: 100, y: 100 }] // > [{topLeft},{bottomRight}]
        , jiggle: {x:{ value: 1 }, y:{ value: 1 }}
    };

    var svg = d3.select("#" + anchorId).select("." + "xvg-jsvis-svg");
    var centrePoint = { x: svgViewBox.width / 2, y: svgViewBox.height }
    var seedCount = 1;
    var seedData = createSeeds(seedCount, svgViewBox, options);


    var baseGroup = svg.select("." + "xvg-jsvis-base-g");


    //growSeeds(baseGroup, seedData, options, onCompleteSvgJiggleReset);
    growSeeds(baseGroup, seedData, options, onCompleteSvgReset);

    // ********************************************** //


}

