import { useEffect, useState } from 'react';
import Loader from 'react-loaders';
import AnimatedLetters from '../AnimatedLetters';
import Blog1Img from '../../assets/images/integration_tests_blog.png';
import Blog2Img from '../../assets/images/ai_bug_fixing_pipeline_blog.svg';
import './index.scss';
import {Card, CardContent, CardHeader, CardMedia, Typography} from "@mui/material";
import { Link } from 'react-router-dom'

const Blog = () => {
    const [letterClass, setLetterClass] = useState('text-animate')

    useEffect(() => {
        setTimeout(() => {
            return setLetterClass('text-animate-hover')
        }, 3000)
    }, [])

    return (
        <>
            <div className="container blog-page">
                <div className="text-zone">
                    <h1>
                        <AnimatedLetters
                            letterClass={letterClass}
                            strArray={['B', 'l', 'o', 'g', '.']}
                            idx={15}
                        />
                    </h1>
                    <div className="blog-grid">
                        <div>
                            <Link to="/react-portfolio-cv/integration-test-blog">
                                <Card sx={{backgroundColor: '#0a5775',maxWidth: 345 }}>
                                    <CardHeader
                                        sx={{color: '#fff'}}
                                        title="Integration Tests using Test Containers for .Net using Microsoft SQL Server"
                                        subheader="November 16, 2024"
                                        subheaderTypographyProps={{ style: { color: '#fff' } }}
                                    />
                                    <CardMedia
                                        component="img"
                                        height="194"
                                        image={Blog1Img}
                                        alt="Integration Tests"
                                    />
                                    <CardContent>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Discover how to streamline your integration testing process in .NET applications using Testcontainers with Microsoft SQL Server.
                                            This post explores how to set up isolated, lightweight containers for database integration tests,
                                            ensuring consistency and reliability across different environments.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                        <div>
                            <Link to="/react-portfolio-cv/ai-bug-fixing-pipeline-blog">
                                <Card sx={{backgroundColor: '#0a5775',maxWidth: 345 }}>
                                    <CardHeader
                                        sx={{color: '#fff'}}
                                        title="Building an Autonomous AI Bug-Fixing Pipeline"
                                        subheader="September 30, 2026"
                                        subheaderTypographyProps={{ style: { color: '#fff' } }}
                                    />
                                    <CardMedia
                                        component="img"
                                        height="194"
                                        image={Blog2Img}
                                        alt="AI Bug-Fixing Pipeline"
                                    />
                                    <CardContent>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            How I built a multi-agent pipeline that turns a plain-English bug report into a
                                            reviewable pull request - covering the agent architecture, Agent2Agent (A2A)
                                            protocol, the Microsoft Agent Framework hosting Claude, the Kubernetes setup
                                            underneath it, and the design decisions (and mistakes) along the way.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Loader type="pacman" active/>
        </>
    )
}

export default Blog