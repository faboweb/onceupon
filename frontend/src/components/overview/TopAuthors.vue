<template>
<div style="display: flex; flex-direction: column">
    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;     margin-top: 1rem;">
        <span>Top authors of the month</span>
        <span style="opacity: 0.3">See all</span>
    </div>
    <div v-if="authors.length > 0">

            <nft-element
            class="author"
            v-for="author in authors"
            :size="69"
            :key="author"
              :nft="getAvatar(author)"
              style="margin-right: 1rem; cursor: pointer"
              @click="router.push('/profile/' + author)"
            />
    </div>
    <div v-else style="display: flex; ">
        <ion-skeleton-text
            v-for="x, i in new Array(5)"
            :key="i"
           style="border-radius: 50%; height: 69px; width: 69px; margin-right: 1rem;"
          :animated="true"
        ></ion-skeleton-text>
    </div>
</div>

</template>

<script setup>
import StoryElement from '@/components/StoryElement.vue'
import { computed } from 'vue';
import { useStoryStore } from '../../store';
import { getAvatar } from "@/scripts/getAvatar";
import NftElement from "@/components/NftElement.vue";
import { useRouter } from 'vue-router';

const storyStore = useStoryStore();
const router = useRouter()
const authors = computed(() => {
    const authors = new Set();
    // TODO get all proposal writer but do via query
    storyStore.stories.forEach(story => {
        authors.add(story.creator);
    });
    return Array.from(authors);
});
</script>

<style>
.author img {
    border-radius: 50%;
}
</style>