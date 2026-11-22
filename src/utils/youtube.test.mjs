import test from 'node:test'
import assert from 'node:assert/strict'
import { parseYouTubeUrl, youtubeEmbedUrl } from './youtube.js'
const id = 'M7lc1UVf-VE'

test('recognizes supported video URLs and generates a trusted player URL', () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${id}&list=ignored`, `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=share`, `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`, `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ]) {
    const video = parseYouTubeUrl(url)
    assert.equal(video.videoId, id)
    const embed = new URL(youtubeEmbedUrl(video, 'fr'))
    assert.equal(embed.origin, 'https://www.youtube-nocookie.com')
    assert.equal(embed.pathname, `/embed/${id}`)
    assert.equal(embed.searchParams.get('hl'), 'fr')
    assert.equal(embed.searchParams.get('playsinline'), '1')
    assert.equal(embed.searchParams.has('list'), false)
  }
})

test('preserves start times in both the embedded player and YouTube link', () => {
  for (const [suffix, seconds] of [['?t=90', 90], ['?t=1m30s', 90], ['?t=1h2m3s', 3723], ['?start=45', 45], ['#t=30s', 30]]) {
    const video = parseYouTubeUrl(`https://youtu.be/${id}${suffix}`)
    assert.equal(video.start, seconds)
    assert.equal(new URL(youtubeEmbedUrl(video, 'en')).searchParams.get('start'), String(seconds))
    assert.equal(new URL(video.watchUrl).searchParams.get('t'), `${seconds}s`)
  }
  assert.equal(parseYouTubeUrl(`https://youtu.be/${id}?t=invalid`).start, 0)
  assert.equal(parseYouTubeUrl(`https://youtu.be/${id}?start=999999999`).start, 86400)
})

test('rejects lookalike hosts, executable URLs, credentials, invalid IDs, playlists and arbitrary HTML', () => {
  for (const url of [
    'javascript:alert(1)', '<iframe src="https://youtube.com/embed/test"></iframe>',
    `https://youtube.com.evil.example/watch?v=${id}`, `https://evil.example/?v=${id}`,
    `https://youtube.com@evil.example/watch?v=${id}`, `https://user:pass@youtube.com/watch?v=${id}`,
    `https://youtube.com:8080/watch?v=${id}`, `https://youtu.be/${id}/extra`,
    'https://youtube.com/watch?v=<script>', 'https://youtube.com/playlist?list=PLtest',
    'https://youtube.com/@channel', '/watch?v=M7lc1UVf-VE', '', null,
  ]) assert.equal(parseYouTubeUrl(url), null, String(url))
})
