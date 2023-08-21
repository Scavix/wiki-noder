import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

function WikipediaPage() {
  const [query, setQuery] = useState('Prolog');
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState(1);
  const [linksCount, setLinksCount] = useState(10);
  const [nodesAmout, setNodesAmout] = useState(0);
  const [linksAmout, setLinksAmout] = useState(0);
  const svgRef = useRef(null);
  const width = window.innerWidth;
  const height = window.innerHeight;

  const fetchWikipediaPage = async () => {
    try {
      console.log('Fetching Wikipedia page...');
      setLoading(true);
      const val = linksCount === 100 ? 'max' : linksCount;
      const response = await axios.get(
        `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=links&pllimit=${val}&format=json&titles=${query}`
      );

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      const firstPage = [{ id: query }];
      const rawContent = pages[pageId].links.map((link) => link.title);
      const secondPage = rawContent.map((title) => ({ id: title }));
      const secondPageLinks = secondPage.map((link) => ({ source: query, target: link }));
      if (depth === 1) {
        setNodesAmout(Array.from(new Set([...firstPage, ...secondPage])).length);
        setLinksAmout(Array.from(new Set(secondPageLinks)).length);
        loadGraph(Array.from(new Set([...firstPage, ...secondPage])), Array.from(new Set(secondPageLinks)));
      }
      if (depth === 2) {
        let thirdPages = [];
        let thirdPagesLinks = [];
        for (let i = 0; i < secondPage.length; i++) {
          const response = await axios.get(
            `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=links&pllimit=${val}&format=json&titles=${secondPage[i].id}`
          );
          const pages = response.data.query.pages;
          const pageId = Object.keys(pages)[0];
          const rawContent = pages[pageId].links.map((link) => link.title);
          const thirdPage = rawContent.map((title) => ({ id: title }));
          const thirdPageLink = thirdPage.map((link) => ({ source: secondPage[i].id, target: link }));
          thirdPages = [...thirdPages, ...thirdPage];
          thirdPagesLinks = [...thirdPagesLinks, ...thirdPageLink];
        }
        const thirdPage = thirdPages;
        const thirdPageLinks = thirdPagesLinks;
        if (depth === 3) {
          let fourthPages = [];
          let fourthPagesLinks = [];
          for (let i = 0; i < thirdPage.length; i++) {
            const response = await axios.get(
              `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=links&pllimit=${val}&format=json&titles=${thirdPage[i].id}`
            );
            const pages = response.data.query.pages;
            const pageId = Object.keys(pages)[0];
            const rawContent = pages[pageId].links.map((link) => link.title);
            const fourthPage = rawContent.map((title) => ({ id: title }));
            const fourthPageLink = fourthPage.map((link) => ({ source: thirdPage[i].id, target: link }));
            fourthPages = [...fourthPages, ...fourthPage];
            fourthPagesLinks = [...fourthPagesLinks, ...fourthPageLink];
          }
          const fourthPage = fourthPages;
          const fourthPageLinks = fourthPagesLinks;
          setNodesAmout(Array.from(new Set([...firstPage, ...secondPage, ...thirdPage, ...fourthPage])).length);
          setLinksAmout(Array.from(new Set([...secondPageLinks, ...thirdPageLinks, ...fourthPageLinks])).length);
          loadGraph(Array.from(new Set([...firstPage, ...secondPage, ...thirdPage, ...fourthPage])), Array.from(new Set([...secondPageLinks, ...thirdPageLinks, ...fourthPageLinks])));
        } else {
          setNodesAmout(Array.from(new Set([...firstPage, ...secondPage, ...thirdPage])).length);
          setLinksAmout(Array.from(new Set([...secondPageLinks, ...thirdPageLinks])).length);
          loadGraph(Array.from(new Set([...firstPage, ...secondPage, ...thirdPage])), Array.from(new Set([...secondPageLinks, ...thirdPageLinks])));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Wikipedia page:', error);
      setLoading(false);
    }
  };


  const loadGraph = async (nodes, links) => {
    try {
      console.log('Loading graph...');
      d3.select(svgRef.current).selectAll('*').remove();
      const svg = d3.select(svgRef.current);


      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(200))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

      const link = svg
        .selectAll('.link')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link');

      const node = svg
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', 10)
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      const labels = svg
        .selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .text((d) => d.id);

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        labels
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y);
      });

      svg
        .selectAll(".node")
        .on("mouseover", function (event, d) {
          svg
            .selectAll(".node")
            .filter((node) => isConnected(d, node))
            .classed("highlight", true);

          svg
            .selectAll(".link")
            .filter((link) => link.source === d || link.target === d)
            .classed("highlight", true);

          svg
            .select(".label")
            .style("display", "block")
            .text(d.id)
            .attr("x", d.x)
            .attr("y", d.y - 10);
        })
        .on("mouseout", function () {
          svg.selectAll(".node").classed("highlight", false);
          svg.selectAll(".link").classed("highlight", false);
          svg.select(".label").style("display", "none");
        });

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      function isConnected(a, b) {
        return links.some((link) => link.source === a && link.target === b);
      }
    } catch (error) {
      console.error('Error loading graph:', error);
    }
  };

  useEffect(() => {
    fetchWikipediaPage();
  }, [query, depth, linksCount]);

  return (
    <div>
      <h1>Wikipedia Page Viewer</h1>
      <div>
        <button onClick={fetchWikipediaPage} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a Wikipedia query"
        />
        <span> Depth: {depth}</span>
        <input
          type="range"
          min="1"
          max="3"
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value))}
        />
        <span> Links: {linksCount === 100 ? 'max' : linksCount}</span>
        <input
          type="range"
          min="10"
          max="100"
          value={linksCount}
          onChange={(e) => setLinksCount(parseInt(e.target.value))}
        />
        <span> Nodes: {nodesAmout}</span>
        <span> Links: {linksAmout}</span>
      </div>
      <div>
        <svg ref={svgRef} width={width} height={height}></svg>
      </div>
    </div>
  );
}

export default WikipediaPage;
